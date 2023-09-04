import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BaseMediaDocument,
  FILE_UPLOAD_CHUNK_SIZE,
  GalleryCategory,
  GallerySortByOption,
  MAX_PINNED_IMAGES,
  Media,
  MediaCollectionName,
  MediaDocumentType,
  ResumableMediaUpload,
  THUMBNAIL_PIXEL_DIMENSIONS,
  UploadedFileObject,
  User,
  UserIdentity,
} from '@caballus/api-common';
import { MediaRepository } from './media.repository';
import { ObjectId } from '@rfx/njs-db/mongo';
import { FileService } from '@rfx/njs-file';
import { environment } from '../../../environments/environment.defaults';
import * as JWPlatformAPI from 'jwplatform';
import * as fs from 'fs';
import * as util from 'util';
import imageThumbnail from 'image-thumbnail';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MapClass } from '@rfx/nst-common';

@Injectable()
export class MediaService {
  constructor(
    private readonly _mediaRepo: MediaRepository,
    private readonly _fileService: FileService,
    private readonly _httpService: HttpService
  ) {}

  @MapClass(Media)
  public async getMediaById(id: ObjectId): Promise<Media> {
    const media = await this._mediaRepo.getMediaById(id);

    /* The above code is checking if the `media` object exists and if it has a `thumbnail` and `latest`
    property with a `path` value. If these properties exist, it calls the `getSignedUrl` function to
    get a signed URL for the corresponding path and assigns it to the `url` property of the
    `thumbnail` and `latest` objects respectively. The `?.` operator is used to avoid errors if the
    `media` object or its properties are null or undefined. */
    if (media) {
      if (media?.thumbnail.path) {
        media.thumbnail.url = await this.getSignedUrl(media?.thumbnail.path);
      }
      if (media?.latest.path) {
        media.latest.url = await this.getSignedUrl(media?.latest.path);
      }
    }

    return media;
  }

  /**
   * Creates a new base media document from the given uploaded file
   * For saving on other db objects for other collections or for saving to media repo inside Media object
   *
   * @param type The type of the document being uploaded
   * @param file The uploaded file object, gotten straight from the
   * @param dateUploaded
   * @UploadedFile decorator in the controller
   * @returns The base media document
   */

  public async createBaseMediaDocument(
    type: MediaDocumentType,
    file: UploadedFileObject,
    dateUploaded?: Date
  ): Promise<BaseMediaDocument> {
    // If mediadoc is not given, create a new one
    const rfxFile = await this._fileService.uploadFile(
      file.buffer,
      file.mimetype,
      'media',
      file.originalname
    );
    const media = new BaseMediaDocument({
      ...rfxFile,
      dateUploaded: dateUploaded || new Date(),
      type,
    });

    return media;
  }

  public async createMedia(
    id: ObjectId = null,
    collectionName: MediaCollectionName,
    collectionId: ObjectId,
    type: MediaDocumentType,
    file: UploadedFileObject,
    uploadedBy: UserIdentity,
    galleryCategory?: GalleryCategory
  ): Promise<BaseMediaDocument> {
    let base;
    let thumbnail;
    switch (type) {
      case MediaDocumentType.Document:
        base = await this.createBaseMediaDocument(type, file, new Date());
        break;
      case MediaDocumentType.Image:
        base = await this.createBaseMediaDocument(type, file, new Date());
        thumbnail = await this._createImageThumbnail(file);
        break;
      case MediaDocumentType.Video:
        base = await this.createBaseMediaDocumentVideo(file);
        thumbnail = await this._createVideoThumbnail(base.jwPlayerId);
        break;
      default:
        throw new BadRequestException('Unknown media type selected');
    }

    const media = new Media({
      _id: id ? id : new ObjectId(),
      collection: collectionName,
      collectionId: collectionId,
      history: [base],
      latest: base,
      thumbnail: thumbnail,
      uploadedBy: uploadedBy,
      galleryCategory: galleryCategory,
    });
    await this._mediaRepo.createMedia(media);
    return base;
  }

  /**
   * This function creates a new media document with a thumbnail and uploads it to a media repository.
   * @param {ObjectId} [id=null] - an optional parameter of type ObjectId, used to specify the ID of the
   * media document being created (if provided)
   * @param {string} filePath - The file path of the media being uploaded.
   * @param {MediaCollectionName} collectionName - The name of the collection to which the media
   * belongs.
   * @param {ObjectId} collectionId - The ID of the collection to which the media belongs.
   * @param {MediaDocumentType} type - MediaDocumentType, which is an enum that specifies the type of
   * media document being created (e.g. image, video, audio, etc.).
   * @param {UploadedFileObject} thumbnail - UploadedFileObject - an object containing information about
   * the thumbnail file uploaded by the user, including the file buffer, mimetype, and original name.
   * @param {UserIdentity} uploadedBy - UserIdentity - This parameter represents the user who uploaded
   * the media file. It contains information such as the user's ID, name, and email.
   * @param {GalleryCategory} [galleryCategory] - galleryCategory is an optional parameter of type
   * GalleryCategory, which is used to specify the category of the media in case it belongs to a
   * gallery. It is used in the creation of a new Media object. If it is not provided, it will be set to
   * undefined.
   * @returns a Promise that resolves to a Media object.
   */
  public async createMediaV2(
    id: ObjectId = null,
    filePath: string,
    collectionName: MediaCollectionName,
    collectionId: ObjectId,
    type: MediaDocumentType,
    thumbnail: UploadedFileObject,
    uploadedBy: UserIdentity,
    galleryCategory?: GalleryCategory
  ): Promise<Media> {
    // thumbnail generation
    const rfxFile = await this._fileService.uploadFile(
      thumbnail.buffer,
      thumbnail.mimetype,
      'media',
      `thumbnail_${thumbnail.originalname}`
    );
    const thumbnailDoc = new BaseMediaDocument({
      ...rfxFile,
      name: `thumbnail_${thumbnail.originalname}`,
      dateUploaded: new Date(),
      type: MediaDocumentType.Image,
    });

    // create base media
    const base = new BaseMediaDocument({
      url: filePath,
      name: thumbnail.originalname,
      path: filePath,
      dateUploaded: new Date(),
      type,
    });

    const media = new Media({
      _id: id ? id : new ObjectId(),
      collection: collectionName,
      collectionId: collectionId,
      history: [base],
      latest: base,
      thumbnail: thumbnailDoc,
      uploadedBy: uploadedBy,
      galleryCategory: galleryCategory,
      // this will be marked as true, when video gets successfully uploaded from the user's device
      isUploaded: false,
    });
    await this._mediaRepo.createMedia(media);
    return media;
  }

  private async _createImageThumbnail(
    file: UploadedFileObject
  ): Promise<BaseMediaDocument> {
    const thumbnail = await imageThumbnail(file.buffer, {
      width: THUMBNAIL_PIXEL_DIMENSIONS,
      height: THUMBNAIL_PIXEL_DIMENSIONS,
    });
    const rfxFile = await this._fileService.uploadFile(
      thumbnail,
      file.mimetype,
      'media',
      `thumbnail_${file.originalname}`
    );
    return new BaseMediaDocument({
      ...rfxFile,
      name: `thumbnail_${file.originalname}`,
      dateUploaded: new Date(),
      type: MediaDocumentType.Image,
    });
  }

  private async _createVideoThumbnail(
    jwPlayerId: string
  ): Promise<BaseMediaDocument> {
    return new BaseMediaDocument({
      path: null,
      name: `thumbnail_${jwPlayerId}`,
      type: MediaDocumentType.Image,
      dateUploaded: new Date(),
      url: `https://cdn.jwplayer.com/v2/media/${jwPlayerId}/poster.jpg?width=${THUMBNAIL_PIXEL_DIMENSIONS}`,
    });
  }

  public getSignedUrl(path): Promise<string> {
    return this._fileService.getUrl(path);
  }

  public async deleteMedia(_id: ObjectId): Promise<void> {
    return await this._mediaRepo.deleteMedia(_id);
  }

  public async urlFromLocalFile(
    localPath: string,
    fileName: string
  ): Promise<string> {
    const rfxFile = await this._fileService.uploadLocalFile(
      localPath,
      'media',
      fileName
    );
    return this.getSignedUrl(rfxFile.path);
  }

  public async createBaseMediaDocumentVideo(
    file: UploadedFileObject
  ): Promise<BaseMediaDocument> {
    try {
      const path = `${__dirname}/assets/${new Date().getTime()}_${
        file.originalname
      }`;
      await fs.promises.writeFile(path, file.buffer);

      const jwApi = new JWPlatformAPI({
        apiKey: environment.jwplayer.key,
        apiSecret: environment.jwplayer.secret,
      });
      const res = await jwApi.upload({}, path);
      const unlink = util.promisify(fs.unlink);
      unlink(path);

      return new BaseMediaDocument({
        name: file.originalname,
        dateUploaded: new Date(),
        type: MediaDocumentType.Video,
        // url: `https://cdn.jwplayer.com/previews/${jwPlayerId}`,
        jwPlayerId: res.media.key,
      });
    } catch (e) {
      console.log(`Error uploading video`, e);
      throw new BadRequestException(`Error uploading video: ${e.message}`);
    }
  }

  public async getPinnedMediaByHorseId(horseId: ObjectId): Promise<Media[]> {
    const media = await this._mediaRepo.getPinnedMediaByHorseId(horseId);
    for (const m of media) {
      await this.addAllSignedUrls(m);
    }
    return media;
  }

  public async getMediaByRideId(
    rideId: ObjectId,
    mediaId: ObjectId
  ): Promise<Media> {
    const media = await this._mediaRepo.getMediaByRideId(rideId, mediaId);
    if (media) {
      if (media?.thumbnail.path) {
        media.thumbnail.url = await this.getSignedUrl(media?.thumbnail.path);
      }
      if (media?.latest.path) {
        media.latest.url = await this.getSignedUrl(media?.latest.path);
      }
    }
    return media;
  }

  /**
   * If image or doc, adds signed url to 'latest' media document and thumbnail
   * If video, skips (thumbnail already has url)
   * @param m
   * @returns
   */
  public async addAllSignedUrls(m: Media): Promise<Media> {
    if (m.latest) {
      m.latest.url = m.latest.path
        ? await this.getSignedUrl(m.latest.path)
        : null;
    }

    if (m.thumbnail) {
      m.thumbnail.url = m.thumbnail.path
        ? await this.getSignedUrl(m.thumbnail.path)
        : null;
    }
    return m;
  }

  /**
   * Uploads an image or video to the horse gallery
   * Uploads images to gclound
   * Uploads videos to jwplayer
   *
   * @throws BadRequestException if no image or video is provided
   *
   * @param id
   * @param details
   * @param media
   * @param lUser
   * @returns void
   */
  public async uploadGalleryMedia(
    horseId: ObjectId,
    data: {
      imageId?: ObjectId;
      videoId?: ObjectId;
    },
    image: UploadedFileObject,
    video: UploadedFileObject,
    lUser: User
  ): Promise<void> {
    if (!image && !video) {
      throw new BadRequestException('An image or video is required');
    }
    if (!!image && !data.imageId) {
      throw new BadRequestException('Image id required with image');
    }
    if (!!video && !data.videoId) {
      throw new BadRequestException('Video id required with video');
    }
    if (image) {
      await this.createMedia(
        data.imageId,
        MediaCollectionName.Horse,
        horseId,
        MediaDocumentType.Image,
        image,
        lUser.toIdentity(),
        GalleryCategory.General
      );
    }
    if (video) {
      await this.createMedia(
        data.videoId,
        MediaCollectionName.Horse,
        horseId,
        MediaDocumentType.Video,
        video,
        lUser.toIdentity(),
        GalleryCategory.General
      );
    }
  }

  /**
   * Pins media to the horse's gallery
   * Optionally accepts mediaId of already pinned image to replace
   *
   * Throws error if there are too many pinned images (exceeding 5) but a pin to replace is not given
   *
   * @param horseId
   * @param mediaToPinId
   * @param pinToReplaceId
   */
  public async pinGalleryImage(
    horseId: ObjectId,
    mediaToPinId: ObjectId,
    pinToReplaceId?: ObjectId
  ): Promise<void> {
    const mediaToPin = await this._mediaRepo.getMediaById(mediaToPinId);

    if (!mediaToPin) {
      throw new NotFoundException('Media not found');
    }
    if (!mediaToPin.collectionId.equals(horseId)) {
      throw new BadRequestException(
        'Media must belong to gallery of selected horse'
      );
    }
    if (mediaToPin.galleryCategory === GalleryCategory.Pinned) {
      throw new BadRequestException('This image is already pinned');
    }

    const existingPins = await this._mediaRepo.getPinnedMediaByHorseId(horseId);

    if (existingPins.length >= MAX_PINNED_IMAGES && !pinToReplaceId) {
      throw new BadRequestException(
        `Only ${MAX_PINNED_IMAGES} images can be pinned to profile. You must replace an existing pin to add a pin.`
      );
    }

    if (pinToReplaceId) {
      const existingPinToReplace = existingPins.find((m) =>
        m._id.equals(pinToReplaceId)
      );
      if (!existingPinToReplace) {
        throw new BadRequestException(
          'Selected pin to replace was not found. Please select another pinned media to replace'
        );
      }
      await this._mediaRepo.changePinnedStatus(
        pinToReplaceId,
        GalleryCategory.General
      );
    }

    await this._mediaRepo.changePinnedStatus(
      mediaToPinId,
      GalleryCategory.Pinned
    );
  }

  public async removePin(
    horseId: ObjectId,
    mediaToUnpinId: ObjectId
  ): Promise<void> {
    const pinnedMedia = await this._mediaRepo.getMediaById(mediaToUnpinId);

    if (!pinnedMedia) {
      throw new NotFoundException('Media not found');
    }
    if (!pinnedMedia.collectionId.equals(horseId)) {
      throw new BadRequestException(
        'Media must belong to gallery of selected horse'
      );
    }
    if (pinnedMedia.galleryCategory !== GalleryCategory.Pinned) {
      throw new BadRequestException('This image is not pinned');
    }

    await this._mediaRepo.changePinnedStatus(
      mediaToUnpinId,
      GalleryCategory.General,
      false
    );
  }

  public async getHorseGallery(
    horseIds: ObjectId[],
    mediaType?: MediaDocumentType,
    sortOption?: GallerySortByOption,
    galleryCategory?: GalleryCategory
  ): Promise<Media[]> {
    const media = await this._mediaRepo.getGalleryMediaByHorseIds(
      horseIds,
      mediaType,
      sortOption,
      galleryCategory
    );
    for (const m of media) {
      await this.addAllSignedUrls(m);
    }
    return media;
  }

  public async deleteMediaByCollectionNameAndId(
    collectionName: MediaCollectionName,
    collectionId: ObjectId
  ): Promise<void> {
    await this._mediaRepo.deleteMediaByCollectionNameAndId(
      collectionName,
      collectionId
    );
  }

  /**
   * This function initiates a resumable media upload to JWPlayer and returns the necessary information
   * for the upload.
   * @param {number} contentLength - The size of the content to be uploaded in bytes.
   * @returns a Promise that resolves to a `ResumableMediaUpload` object. The `ResumableMediaUpload`
   * object contains the `jwPlayerId`, `uploadId`, `uploadToken`, and `uploadLinks` properties.
   */
  public async initiateResumableUpload(
    contentLength: number
  ): Promise<ResumableMediaUpload> {
    try {
      // create JWPlayer media
      const mediaReqResponse = await firstValueFrom(
        this._httpService.post(
          `https://api.jwplayer.com/v2/sites/${environment.jwplayer.key}/media`,
          {
            upload: { method: 'multipart' },
            metadata: {},
          },
          {
            headers: {
              Authorization: `Bearer ${environment.jwplayer.apiSecret}`,
            },
          }
        )
      );

      // calculate total chunks to be uploaded
      const totalChunksToUpload = Math.ceil(
        contentLength / FILE_UPLOAD_CHUNK_SIZE
      );

      // get a list of upload parts
      const uploadLinksRes = await firstValueFrom(
        this._httpService.get(
          `https://api.jwplayer.com/v2/uploads/${mediaReqResponse.data.upload_id}/parts?page=1&page_length=${totalChunksToUpload}`,
          {
            headers: {
              Authorization: `Bearer ${mediaReqResponse.data.upload_token}`,
            },
          }
        )
      );

      // return uploadId, uploadToken and uploadLinks
      return new ResumableMediaUpload({
        jwPlayerId: mediaReqResponse.data.id,
        uploadId: mediaReqResponse.data.upload_id,
        uploadToken: mediaReqResponse.data.upload_token,
        uploadLinks: uploadLinksRes.data.parts.map((part) => part.upload_link),
      });
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  /**
   * This function completes the upload of an image file and updates the media repository with the file
   * path.
   * @param {ObjectId} mediaId - The ID of the media file being uploaded.
   * @param {UploadedFileObject} image - UploadedFileObject - an object containing information about
   * the uploaded image file, including the file buffer, mimetype, and original name.
   */
  public async completeImageUpload(
    mediaId: ObjectId,
    image: UploadedFileObject
  ) {
    const imageFile = await this._fileService.uploadFile(
      image.buffer,
      image.mimetype,
      'media',
      `thumbnail_${image.originalname}`
    );

    await this._mediaRepo.completeImageUpload(mediaId, imageFile.path);
  }

  /**
   * This function completes a resumable upload to JWPlayer and updates the video path in the media
   * repository.
   * @param {string} uploadId - a string representing the unique identifier for the resumable upload
   * session.
   * @param {string} uploadToken - The uploadToken parameter is a string that represents the token used
   * for authorization in the API request to complete a resumable upload.
   * @param {ObjectId} mediaId - The ID of the media file being uploaded.
   * @param {string} jwPlayerId - The `jwPlayerId` parameter is a string that represents the unique
   * identifier of a video in the JW Player platform. It is used in the `updateVideoPath` method to
   * update the video path in the database after the resumable upload is completed.
   */
  public async completeResumableUpload(
    uploadId: string,
    uploadToken: string,
    mediaId: ObjectId,
    jwPlayerId: string
  ): Promise<void> {
    try {
      await firstValueFrom(
        this._httpService.put(
          `https://api.jwplayer.com/v2/uploads/${uploadId}/complete`,
          {},
          {
            headers: {
              Authorization: `Bearer ${uploadToken}`,
            },
          }
        )
      );
      await this._mediaRepo.updateVideoPath(mediaId, jwPlayerId);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  /**
   * This function refreshes upload links for a given upload ID and token, and returns an array of the
   * refreshed links.
   * @param {string} uploadId - a string representing the unique identifier for the upload process.
   * @param {string} uploadToken - The upload token is a string that is used to authenticate and
   * authorize the user to upload a file to the JWPlayer platform. It is passed as a header in the HTTP
   * request to the API endpoint.
   * @param {number} contentLength - The size of the file to be uploaded in bytes.
   * @returns An array of strings, which are the upload links for the parts of a file being uploaded.
   */
  public async refreshUploadLinks(
    uploadId: string,
    uploadToken: string,
    contentLength: number
  ): Promise<Array<string>> {
    try {
      // calculate total chunks to be uploaded
      const totalChunksToUpload = Math.ceil(
        contentLength / FILE_UPLOAD_CHUNK_SIZE
      );
      const refreshedLinksResp = await firstValueFrom(
        this._httpService.get(
          `https://api.jwplayer.com/v2/uploads/${uploadId}/parts?page=1&page_length=${totalChunksToUpload}`,
          {
            headers: {
              Authorization: `Bearer ${uploadToken}`,
            },
          }
        )
      );

      return refreshedLinksResp.data.parts.map((part) => part.upload_link);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
