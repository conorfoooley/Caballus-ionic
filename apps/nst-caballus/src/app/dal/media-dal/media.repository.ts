import { BadRequestException, Injectable } from "@nestjs/common";
import {
  MongoRepository,
  ObjectId,
  MongoCollectionName,
  UpdateParams,
  FindParams,
  stringEqual
} from "@rfx/nst-db/mongo";
import {
  GalleryCategory,
  GallerySortByOption,
  MAX_PINNED_IMAGES,
  Media,
  MediaCollectionName,
  MediaDocumentType
} from "@caballus/api-common";
import { Pagination, Status } from "@rfx/common";
import { UpdateWriteOpResult } from "mongodb";
import { MapClass } from "@rfx/nst-common";
import { pipe } from "rxjs";

@MongoCollectionName("media")
@Injectable()
export class MediaRepository extends MongoRepository {
  /**
   * Edit a media file, inserts the given media document into the history
   * array and sets it as the latest. The id is the file name and vice versa.
   * If the media document doesn't already exist it will be created.
   *
   * @param mediaId The id/filename of the media instance
   * @param mediadoc The media document to insert into the database
   * @returns Mongo write results
   */
  public editMedia(mediadoc: Media): Promise<UpdateWriteOpResult> {
    const params = new UpdateParams();
    params.isUpsert = true;
    params.query = { _id: mediadoc._id };
    const update: object = {
      $set: { _id: mediadoc._id, latest: mediadoc },
      $push: { history: mediadoc }
    };
    return this.updateBase(update, params);
  }

  /**
   * Create Media
   *
   * @param media
   * @returns The media id
   */
  public async createMedia(media: Partial<Media>): Promise<ObjectId> {
    return this.create(media);
  }

  /**
   * Delete a media
   *
   * @param id
   * @returns void
   */
  public async deleteMedia(id: ObjectId): Promise<void> {
    await this.updateById(id, { status: Status.InActive });
  }

  public async getPinnedMediaByHorseId(hId: ObjectId): Promise<Media[]> {
    const fParams = new FindParams({
      query: {
        collection: MediaCollectionName.Horse,
        collectionId: hId,
        galleryCategory: GalleryCategory.Pinned
      },
      limit: MAX_PINNED_IMAGES
    });

    return (await this.find<Media>(fParams))[0];
  }

  public async getMediaByRideId(rideId: ObjectId, mediaId: ObjectId): Promise<Media> {
    const fParams = new FindParams({
      query: {
        _id: mediaId,
        collection: MediaCollectionName.Ride,
        collectionId: rideId
      }
    });

    return (await this.findOne<Media>(fParams));
  }

  public async changePinnedStatus(
    mId: ObjectId,
    galleryCategory: GalleryCategory,
    relationalHorseRemove = false
  ): Promise<void> {
      const update = {
          galleryCategory: galleryCategory,
          collectionId: null
      };

      if (!relationalHorseRemove) {
          delete update.collectionId;
      }

    await this.updateById(mId, update);
  }

  @MapClass(Media)
  public async getMediaById(id: ObjectId): Promise<Media> {
    return this.findOneById<Media>(id, new FindParams());
  }

  public async getGalleryMediaByHorseIds(
    hIds: ObjectId[],
    mediaType?: MediaDocumentType,
    sortOption?: GallerySortByOption,
    galleryCategory?: GalleryCategory
  ): Promise<Media[]> {
    const fParams = new FindParams({
      query: {
        collection: MediaCollectionName.Horse,
        collectionId: { $in: hIds }
      }
    });
    if (!!mediaType) {
      fParams.query = pipe(stringEqual("latest.type", mediaType))(fParams.query);
    }
    if (!!galleryCategory) {
      fParams.query = pipe(stringEqual("galleryCategory", galleryCategory))(fParams.query);
    }

    if (galleryCategory === GalleryCategory.Pinned) {
      fParams.setPagination(
        new Pagination({
          limit: MAX_PINNED_IMAGES
        })
      );
    } else {
      fParams.getAllResults(true);
    }

    if (!!sortOption) {
      switch (sortOption) {
        case GallerySortByOption.NewestToOldest:
          fParams.addSortFieldDescending("createdDate");
          break;
        case GallerySortByOption.OldestToNewest:
          fParams.addSortFieldAscending("createdDate");
          break;
        case GallerySortByOption.Pinned:
          fParams.addSortFieldDescending("galleryCategory");
          break;
        default:
          throw new BadRequestException("Invalid gallery sort option");
      }
    }

    return (await this.find<Media>(fParams))[0];
  }

  /**
   * Delete media by collection name and it's id
   *
   * @returns void
   * @param collectionName
   * @param collectionId
   */
  public async deleteMediaByCollectionNameAndId(
    collectionName: MediaCollectionName,
    collectionId: ObjectId
  ): Promise<void> {
    const params = new UpdateParams();
    params.query = { status: Status.InActive };
    await this.update(
      {
        collection: collectionName,
        collectionId
      },
      params
    );
  }

  public async completeImageUpload(mediaId: ObjectId, imageUrl: string): Promise<UpdateWriteOpResult> {
    return this.updateById(mediaId, {
      "latest.path": imageUrl,
      "history.0.path": imageUrl,
      isUploaded: true
    });
  }

  public async updateVideoPath(mediaId: ObjectId, jwPlayerId: string): Promise<UpdateWriteOpResult> {
    return this.updateById(mediaId, {
      "latest.jwPlayerId": jwPlayerId,
      "history.0.jwPlayerId": jwPlayerId,
      isUploaded: true
    });
  }
}
