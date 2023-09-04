import { Injectable } from '@angular/core';
import {
    BaseMediaDocument,
    DeleteGalleryMediaDto,
    GalleryCategory,
    GalleryService,
    Media,
    MediaCollectionName,
    MediaData,
    MediaDocumentType,
    MediaMetadata,
    MediaService,
    MediaSubjectType,
    MediaUploadItem,
    PinMediaDto,
    ResumableMediaUpload,
    THUMBNAIL_PIXEL_DIMENSIONS
} from '@caballus/ui-common';
import { StorageService } from '../../services/storage.service';
import { CapacitorPluginService } from '../../services/capacitor-plugin.service';
import { ThumbnailService } from '../../services/thumbnail.service';
import { HorseCache } from '../../caches/horse/horse.cache';
import { combineLatest, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, defaultIfEmpty, map, share, switchMap, take, tap } from 'rxjs/operators';
import { base64Size, bytesToSize, serialSwitchMap } from '../../util';
import { ImageOptions } from '@capacitor/camera';
import { createObjectID } from 'mongo-object-reader';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoService } from '@ion-caballus/core/services';
import { Store } from '@ngxs/store';
import { AddItemToQueueAction } from '@ion-caballus/core/state/actions';

enum Keys {
    GalleryImageThumbnailsMetadata = 'gallery-image-thumbnails-metadata-',
    GalleryImagesRequiringServerThumbnail = 'gallery-images-requiring-server-thumbnail-',
    UnsyncedGalleryImagesMetadata = 'unsynced-gallery-images-metadata-',
    UnsyncedGalleryVideosMetadata = 'unsynced-gallery-videos-metadata-',
    CurrentRideImagesMetadata = 'current-ride-images-metadata-',
    UnsyncedRideImagesMetadata = 'unsynced-ride-images-metadata-',
    CurrentRideVideosMetadata = 'current-ride-videos-metadata-',
    UnsyncedRideVideosMetadata = 'unsynced-ride-videos-metadata-',
    UnsyncedPinActions = 'unsynced-pin-actions-',
    UnsyncedGalleryMediaToDelete = 'unsynced-gallery-media-to-delete-',
    ImageBlobFull = 'image-blob-full-',
    ImageBlobThumbnail = 'image-blob-thumbnail-'
}

export { Keys as MediaCacheKeys };

@Injectable({ providedIn: 'root' })
export class MediaCache {
    private _currentUnsyncedChangesUpload$: Observable<void> = null;
    private _currentUnsyncedGalleryImagesUpload$: Observable<void> = null;
    private _currentUnsyncedPinActionsUpload$: Observable<void> = null;
    private _currentUnsyncedGalleryDeletesUpload$: Observable<void> = null;
    private _currentGalleryImageThumbnailsDownload$: Observable<void> = null;

    constructor(
        private readonly _storageService: StorageService,
        private readonly _capacitorPluginService: CapacitorPluginService,
        private readonly _galleryService: GalleryService,
        private readonly _horseCache: HorseCache,
        private readonly _sanitizer: DomSanitizer,
        private readonly _thumbnailService: ThumbnailService,
        private readonly _mediaService: MediaService,
        private readonly _store: Store,
        private readonly _videoService: VideoService
    ) {}

    public sync(): Observable<void> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected
                        ? of(undefined)
                        : this._uploadUnsyncedChanges().pipe(
                              switchMap(() => this._syncHorseGalleryImageThumbnailsCache())
                          )
                )
            );
    }

    private _uploadUnsyncedChanges(): Observable<void> {
        if (!this._currentUnsyncedChangesUpload$) {
            this._currentUnsyncedChangesUpload$ = this._uploadUnsyncedGalleryImages().pipe(
                switchMap(() => this._syncPinActionsCache()),
                switchMap(() => from(this._storageService.clearUserData(Keys.UnsyncedPinActions))),
                switchMap(() => this._syncGalleryDeletesCache()),
                switchMap(() =>
                    from(this._storageService.clearUserData(Keys.UnsyncedGalleryMediaToDelete))
                ),
                tap(() => (this._currentUnsyncedChangesUpload$ = null)),
                share()
            );
        }
        return this._currentUnsyncedChangesUpload$;
    }

    public addGalleryPhoto(horseId: string, imageOptions: ImageOptions): Observable<MediaData> {
        return this._addUnsyncedImageToCache(
            horseId,
            imageOptions,
            MediaSubjectType.HorseGalleryImage
        );
    }

    public addGalleryVideo(mediaData: MediaData): Observable<MediaData> {
        return this._addUnsyncedVideoToCache(
            mediaData,
            MediaSubjectType.HorseGalleryVideo
        );
    }

    public addRidePhoto(
        rideId: string,
        imageOptions: ImageOptions,
        mediaSubjectType: MediaSubjectType
    ): Observable<MediaData> {
        return this._addUnsyncedImageToCache(rideId, imageOptions, mediaSubjectType);
    }

    public addRideVideo(
        mediaData: MediaData,
        mediaSubjectType: MediaSubjectType
    ): Observable<MediaData> {
        return this._addUnsyncedVideoToCache(
            mediaData,
            mediaSubjectType
        );
    }

    public getRideMedia(rideId: string): Observable<Media[]> {
        return forkJoin([
            this._cachedUnsyncedRideImagesMetadata(),
            this._cachedUnyncedRideVideosMetadata()
        ]).pipe(
            map(([photosMetadata, videosMetadata]) => [
                ...photosMetadata.filter(m => m.mediaSubjectId === rideId),
                ...videosMetadata.filter(m => m.mediaSubjectId === rideId)
            ]),
            switchMap(metadata => this._appendSafeUrlsToMetadata(metadata)),
            map(data =>
                data.map(
                    d =>
                        new Media({
                            _id: d.mediaId,
                            collectionId: d.mediaSubjectId,
                            thumbnail: new BaseMediaDocument({
                                safeUrl: d.safeUrl
                            })
                        })
                )
            )
        );
    }

    public migrateCurrentRideMediaToUploadQueue(): Observable<void> {
        return forkJoin([
            this._cachedCurrentRideImagesMetadata(),
            this._cachedCurrentRideVideosMetadata()
        ]).pipe(
            switchMap(([imagesMetaData, videoMetaData]) => {
                const metaData = imagesMetaData.concat(videoMetaData);
                if (metaData.length) {
                    return this._capacitorPluginService
                        .networkStatus()
                        .pipe(
                            switchMap(network =>
                                network.connected
                                    ? this._prepareMediaForUpload(metaData)
                                    : this._moveMediaMetaDataToUploadQueue(metaData)
                            )
                        );
                }
                return of(undefined);
            }),
            switchMap(() =>
                // remove current ride media from cache
                from(
                    // remove images metadata
                    this._storageService.clearUserData(Keys.CurrentRideImagesMetadata)
                ).pipe(
                    switchMap(() =>
                        from(
                            // remove videos metadata
                            this._storageService.clearUserData(Keys.CurrentRideVideosMetadata)
                        )
                    )
                )
            )
        );
    }

    /**
     * removeCurrentRideMediaByMediaId
     * removes the media from the current ride cache
     * @param media
     */
    public removeCurrentRideMediaByMediaId(media: Media): Observable<void> {
        // determine if the media is a photo or video
        // and remove it from the correct cache
        const observable =
            media.latest.type === MediaDocumentType.Image
                ? this._cachedCurrentRideImagesMetadata()
                : this._cachedCurrentRideVideosMetadata();
        const key =
            media.latest.type === MediaDocumentType.Image
                ? Keys.CurrentRideImagesMetadata
                : Keys.CurrentRideVideosMetadata;

        return observable.pipe(
            map(toFilter => toFilter.filter(u => u.mediaId !== media._id)),
            switchMap(filtered =>
                from(this._storageService.setUserData(key, JSON.stringify(filtered)))
            ),
            switchMap(() =>
                // remove local blob wherever it might be
                forkJoin([
                    // remove thumbnail image / video
                    this._removeUserImageBlob(media._id, true),
                    // remove full size image
                    this._removeUserImageBlob(media._id, false)
                ]).pipe(map(() => undefined))
            )
        );
    }

    public getPinnedHorseMedia(horseId: string): Observable<Media[]> {
        /*
        TODO: Include Videos
    */
        return this._getPinnedHorseImageThumbnails(horseId);
    }

    public getHorseMedia(horseId: string): Observable<Media[]> {
        /*
        TODO: Include Videos
    */
        return this._getHorseImageThumbnails(horseId);
    }

    public pinHorseMedia(
        horseId: string,
        mediaToPin: string,
        pinnedMediaToReplace?: string
    ): Observable<void> {
        // do not filter to avoid truncating data on save
        return this._allGalleryImagesMetadata(false).pipe(
            map((dat): [MediaMetadata[], MediaMetadata[]] => {
                const synced = (dat as [MediaMetadata[], MediaMetadata[]])[0];
                const unsynced = (dat as [MediaMetadata[], MediaMetadata[]])[1];
                const toPinSyncedIdx = synced.findIndex(s => s.mediaId === mediaToPin);
                const toPinUnsyncedIdx = unsynced.findIndex(u => u.mediaId === mediaToPin);
                if (toPinSyncedIdx >= 0) {
                    const syncedToPin = {
                        ...synced[toPinSyncedIdx],
                        galleryCategory: GalleryCategory.Pinned
                    };
                    synced.splice(toPinSyncedIdx, 1, syncedToPin);
                }
                if (toPinUnsyncedIdx >= 0) {
                    const unsyncedToPin = {
                        ...unsynced[toPinUnsyncedIdx],
                        galleryCategory: GalleryCategory.Pinned
                    };
                    unsynced.splice(toPinUnsyncedIdx, 1, unsyncedToPin);
                }
                if (pinnedMediaToReplace) {
                    const replaceSyncedIdx = synced.findIndex(
                        s => s.mediaId === pinnedMediaToReplace
                    );
                    const replaceUnsyncedIdx = unsynced.findIndex(
                        u => u.mediaId === pinnedMediaToReplace
                    );
                    if (replaceSyncedIdx >= 0) {
                        const syncedToReplace = {
                            ...synced[replaceSyncedIdx],
                            galleryCategory: GalleryCategory.General
                        };
                        synced.splice(replaceSyncedIdx, 1, syncedToReplace);
                    }
                    if (replaceUnsyncedIdx >= 0) {
                        const unsyncedToReplace = {
                            ...unsynced[replaceUnsyncedIdx],
                            galleryCategory: GalleryCategory.General
                        };
                        unsynced.splice(replaceUnsyncedIdx, 1, unsyncedToReplace);
                    }
                }
                return [synced, unsynced];
            }),
            switchMap((dat: [MediaMetadata[], MediaMetadata[]]) =>
                forkJoin([
                    from(
                        this._storageService.setUserData(
                            Keys.GalleryImageThumbnailsMetadata,
                            JSON.stringify(dat[0])
                        )
                    ),
                    from(
                        this._storageService.setUserData(
                            Keys.UnsyncedGalleryImagesMetadata,
                            JSON.stringify(dat[1])
                        )
                    )
                ])
            ),
            switchMap(() => this._unsyncedPinActions()),
            map(unsynced => [
                ...unsynced,
                {
                    horseId,
                    mediaToPin,
                    pinnedMediaToReplace: pinnedMediaToReplace ? pinnedMediaToReplace : undefined
                }
            ]),
            switchMap(unsyncedPinActions =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedPinActions,
                        JSON.stringify(unsyncedPinActions)
                    )
                )
            )
        );
    }

    public deleteHorseGalleryMedia(mediaId: string, horseId: string): Observable<void> {
        /*
        TODO: work with videos
    */
        return this._cachedGalleryImageThumbnailsMetadata().pipe(
            // check synced galllery images
            map(synced => {
                const idx = synced.findIndex(
                    s => s.mediaId === mediaId && s.mediaSubjectId === horseId
                );
                const save = idx >= 0;
                if (save) {
                    synced.splice(idx, 1);
                }
                return { synced, save };
            }),
            switchMap((v: { synced: MediaMetadata[]; save: boolean }) =>
                !v.save
                    ? // if found in synced, need to cache a delete action and upload it later
                      of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.GalleryImageThumbnailsMetadata,
                              JSON.stringify(v.synced)
                          )
                      ).pipe(
                          switchMap(() =>
                              this._cachedUnsyncedGalleryMediaToDelete().pipe(
                                  map(unsynced => [...unsynced, { mediaId, horseId }]),
                                  switchMap(allUnsynced =>
                                      from(
                                          this._storageService.setUserData(
                                              Keys.UnsyncedGalleryMediaToDelete,
                                              JSON.stringify(allUnsynced)
                                          )
                                      )
                                  )
                              )
                          )
                      )
            ),
            switchMap(() =>
                // check unsynced gallery images
                this._cachedUnsyncedGalleryImagesMetadata().pipe(
                    map(unsynced => {
                        const idx = unsynced.findIndex(
                            u => u.mediaId === mediaId && u.mediaSubjectId === horseId
                        );
                        const save = idx >= 0;
                        if (save) {
                            unsynced.splice(idx, 1);
                        }
                        return { unsynced, save };
                    }),
                    switchMap((v: { unsynced: MediaMetadata[]; save: boolean }) =>
                        !v.save
                            ? of(undefined)
                            : from(
                                  this._storageService.setUserData(
                                      Keys.UnsyncedGalleryImagesMetadata,
                                      JSON.stringify(v.unsynced)
                                  )
                              )
                    )
                )
            ),
            switchMap(() =>
                // remove local blob wherever it might be
                forkJoin([
                    this._removeUserImageBlob(mediaId, true),
                    this._removeUserImageBlob(mediaId, false)
                ]).pipe(map(() => undefined))
            )
        );
    }

    private _getHorseImageThumbnails(horseId: string): Observable<Media[]> {
        return this._allGalleryImagesMetadata(true, horseId).pipe(
            map(metadata => metadata as MediaMetadata[]),
            switchMap(metadata => this._appendSafeUrlsToMetadata(metadata)),
            map(data =>
                data.map(
                    d =>
                        new Media({
                            _id: d.mediaId,
                            collectionId: d.mediaSubjectId,
                            thumbnail: new BaseMediaDocument({
                                safeUrl: d.safeUrl
                            })
                        })
                )
            )
        );
    }

    private _getPinnedHorseImageThumbnails(horseId: string): Observable<Media[]> {
        return this._allGalleryImagesMetadata(true, horseId).pipe(
            map(metadata =>
                (metadata as MediaMetadata[]).filter(
                    m => m.galleryCategory === GalleryCategory.Pinned
                )
            ),
            switchMap(metadata => this._appendSafeUrlsToMetadata(metadata)),
            map(data =>
                data.map(
                    d =>
                        new Media({
                            _id: d.mediaId,
                            collectionId: d.mediaSubjectId,
                            thumbnail: new BaseMediaDocument({
                                safeUrl: d.safeUrl
                            })
                        })
                )
            )
        );
    }

    private _uploadUnsyncedGalleryImages(): Observable<void> {
        if (!this._currentUnsyncedGalleryImagesUpload$) {
            this._currentUnsyncedGalleryImagesUpload$ =
                this._cachedUnsyncedGalleryImagesMetadata().pipe(
                    map(meta => {
                        const observables: Observable<void>[] = [];
                        for (let _m = 0; _m < meta.length; ++_m) {
                            observables.push(this._uploadUnsyncedGalleryImage());
                        }
                        return serialSwitchMap(observables);
                    }),
                    switchMap(serial => serial),
                    tap(() => (this._currentUnsyncedGalleryImagesUpload$ = null)),
                    share()
                );
        }
        return this._currentUnsyncedGalleryImagesUpload$;
    }

    private _uploadUnsyncedGalleryImage(): Observable<void> {
        return this._cachedUnsyncedGalleryImagesMetadata().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : of(unsynced).pipe(
                          map(allUnsynced => allUnsynced[0]),
                          switchMap((v: MediaMetadata) =>
                              this.getUserImageBlob(v.mediaId, false).pipe(
                                  map(blob => ({
                                      blob,
                                      imageId: v.mediaId,
                                      horseId: v.mediaSubjectId
                                  }))
                              )
                          ),
                          switchMap((v: { horseId: string; imageId: string; blob: Blob }) =>
                              this._galleryService
                                  .uploadImageToHorseGallery(v.horseId, v.imageId, v.blob)
                                  .pipe(
                                      map(() => ({
                                          mediaSubjectId: v.horseId,
                                          mediaId: v.imageId
                                      })),
                                      switchMap((meta: MediaMetadata) =>
                                          // do not filter to avoid truncating data on save
                                          this._galleryImagesRequiringServerThumbnail().pipe(
                                              map(requiring => [...requiring, meta])
                                          )
                                      ),
                                      switchMap(allRequiring =>
                                          from(
                                              this._storageService.setUserData(
                                                  Keys.GalleryImagesRequiringServerThumbnail,
                                                  JSON.stringify(allRequiring)
                                              )
                                          )
                                      ),
                                      switchMap(() =>
                                          this._migrateMetadata(
                                              0,
                                              Keys.UnsyncedGalleryImagesMetadata,
                                              Keys.GalleryImageThumbnailsMetadata
                                          )
                                      )
                                  )
                          )
                      )
            )
        );
    }

    private _uploadUnsyncedRideImage(mediaMeta: MediaMetadata): Observable<Media> {
        return this.getUserImageBlob(mediaMeta.mediaId, true).pipe(
            map(blob => ({
                blob,
                imageId: mediaMeta.mediaId,
                rideId: mediaMeta.mediaSubjectId
            })),
            switchMap((v: { rideId: string; imageId: string; blob: Blob }) =>
                this._mediaService.createMedia(
                    v.imageId,
                    v.rideId,
                    v.blob,
                    MediaDocumentType.Image,
                    MediaCollectionName.Ride
                )
            ),
            switchMap(media =>
                forkJoin([
                    this._removeUserImageBlob(media._id, true),
                    this._cachedUnsyncedRideImagesMetadata().pipe(
                        map(toFilter => toFilter.filter(u => u.mediaId !== media._id)),
                        switchMap(filtered =>
                            from(
                                this._storageService.setUserData(
                                    Keys.UnsyncedRideImagesMetadata,
                                    JSON.stringify(filtered)
                                )
                            )
                        )
                    )
                ]).pipe(map(() => media))
            ),
            map(media => media)
        );
    }

    private _uploadUnsyncedRideVideo(mediaMeta: MediaMetadata): Observable<Media> {
        return this.getUserImageBlob(mediaMeta.mediaId, true).pipe(
            map(blob => ({
                blob,
                videoId: mediaMeta.mediaId,
                rideId: mediaMeta.mediaSubjectId,
                filePath: mediaMeta.filePath
            })),
            switchMap((v: { rideId: string; videoId: string; blob: Blob; filePath: string }) =>
                this._mediaService.createMedia(
                    v.videoId,
                    v.rideId,
                    v.blob,
                    MediaDocumentType.Video,
                    MediaCollectionName.Ride,
                    v.filePath
                )
            ),
            switchMap(media =>
                forkJoin([
                    // remove video thumbnail
                    this._removeUserImageBlob(media._id, true),
                    // filter out uploaded entry from the unSynced videos metadata
                    this._cachedUnsyncedRideVideosMetadata().pipe(
                        map(toFilter => toFilter.filter(u => u.mediaId !== media._id)),
                        switchMap(filtered =>
                            from(
                                this._storageService.setUserData(
                                    Keys.UnsyncedRideVideosMetadata,
                                    JSON.stringify(filtered)
                                )
                            )
                        )
                    )
                ]).pipe(map(() => media))
            ),
            map(media => media)
        );
    }

    private _migrateMetadata(idx: number, fromKey: Keys, toKey: Keys): Observable<void> {
        return from(this._storageService.getUserData(fromKey)).pipe(
            map(json => {
                const fromData = this._parseMediaMetadata(json);
                const migrant = fromData[idx];
                fromData.splice(idx, 1);
                return { splicedJson: JSON.stringify(fromData), migrant };
            }),
            switchMap((v: { splicedJson: string; migrant: MediaMetadata }) =>
                from(this._storageService.setUserData(fromKey, v.splicedJson)).pipe(
                    map(() => v.migrant)
                )
            ),
            switchMap((migrant: MediaMetadata) =>
                from(this._storageService.getUserData(toKey)).pipe(
                    map(json => {
                        const toData = this._parseMediaMetadata(json);
                        toData.push(migrant);
                        return JSON.stringify(toData);
                    })
                )
            ),
            switchMap((appendedJson: string) =>
                from(this._storageService.setUserData(toKey, appendedJson))
            )
        );
    }

    private _addUnsyncedImageToCache(
        subjectId: string,
        imageOptions: ImageOptions,
        mediaSubjectType: MediaSubjectType
    ): Observable<MediaData> {
        return this._capacitorPluginService.getPhoto(imageOptions).pipe(
            switchMap(photo =>
                !photo
                    ? of(undefined)
                    : of(photo).pipe(
                          switchMap(p =>
                              this._thumbnailService
                                  .getPhotoThumbnail(
                                      p,
                                      THUMBNAIL_PIXEL_DIMENSIONS,
                                      THUMBNAIL_PIXEL_DIMENSIONS
                                  )
                                  .pipe(
                                      map(thumbnailDataUrl => ({
                                          dataUrl: p.dataUrl,
                                          thumbnailDataUrl,
                                          mediaSubjectId: subjectId,
                                          mediaId: createObjectID(),
                                          fileSize: base64Size(p.dataUrl),
                                          filePath: p.path
                                      }))
                                  )
                          ),
                          switchMap((v: MediaData) =>
                              forkJoin([
                                  this._imageUrlToBlob(v.dataUrl).pipe(
                                      switchMap(blob =>
                                          this._setUserImageBlob(v.mediaId, blob, false)
                                      )
                                  ),
                                  this._imageUrlToBlob(v.thumbnailDataUrl).pipe(
                                      switchMap(blob =>
                                          this._setUserImageBlob(v.mediaId, blob, true)
                                      )
                                  )
                              ]).pipe(map(() => v))
                          ),
                          switchMap((v: MediaData) => {
                              if (mediaSubjectType === MediaSubjectType.CurrentRideImage) {
                                  // get the cached data for the specified key
                                  // do not filter to avoid truncating data on save
                                  return this._cachedCurrentRideImagesMetadata().pipe(
                                      map(unsynced => [
                                          ...unsynced,
                                          {
                                              mediaId: v.mediaId,
                                              mediaSubjectId: v.mediaSubjectId,
                                              mediaType: MediaDocumentType.Image,
                                              mediaSubjectType: MediaSubjectType.CurrentRideImage,
                                              mediaCollectionName: MediaCollectionName.Ride,
                                              fileSize: v.fileSize,
                                              filePath: v.filePath
                                          }
                                      ]),
                                      switchMap(allUnsynced =>
                                          this._storageService.setUserData(
                                              Keys.CurrentRideImagesMetadata,
                                              JSON.stringify(allUnsynced)
                                          )
                                      ),
                                      map(() => v)
                                  );
                              } else {
                                  /**
                                   * for horse gallery images, profile images and existing ride images we don't need to cache the metadata
                                   * just add the image to the upload queue and return the media data
                                   * */
                                  return this._store
                                      .dispatch(
                                          new AddItemToQueueAction(
                                              new MediaUploadItem({
                                                  mediaId: v.mediaId,
                                                  mediaSubjectId: v.mediaSubjectId,
                                                  mediaType: MediaDocumentType.Image,
                                                  mediaSubjectType,
                                                  mediaCollectionName:
                                                      mediaSubjectType ===
                                                      MediaSubjectType.ExistingRideImage
                                                          ? MediaCollectionName.Ride
                                                          : MediaCollectionName.Horse,
                                                  fileSize: v.fileSize,
                                                  filePath: v.filePath,
                                                  fileSizeInString: bytesToSize(v.fileSize),
                                                  uploadedFileSizeInString: bytesToSize(0)
                                              })
                                          )
                                      )
                                      .pipe(map(() => v));
                              }
                          })
                      )
            ),
            catchError(err => {
                return of(null);
            })
        );
    }

    private _addUnsyncedVideoToCache(
        mediaData: MediaData,
        mediaSubjectType: MediaSubjectType
    ): Observable<MediaData> {
        return of(mediaData).pipe(
            take(1),
            switchMap((v: MediaData) =>
                forkJoin([
                    this._imageUrlToBlob(v.thumbnailDataUrl).pipe(
                        switchMap(blob => this._setUserImageBlob(v.mediaId, blob, true))
                    )
                ]).pipe(map(() => v))
            ),
            switchMap((v: MediaData) => {
                if (mediaSubjectType === MediaSubjectType.CurrentRideVideo) {
                    // do not filter to avoid truncating data on save
                    return this._cachedCurrentRideVideosMetadata().pipe(
                        take(1),
                        map(unsynced => [
                            ...unsynced,
                            {
                                mediaId: v.mediaId,
                                mediaSubjectId: v.mediaSubjectId,
                                mediaType: MediaDocumentType.Video,
                                mediaSubjectType: MediaSubjectType.CurrentRideVideo,
                                mediaCollectionName: MediaCollectionName.Ride,
                                filePath: mediaData.filePath,
                                fileSize: mediaData.fileSize
                            }
                        ]),
                        switchMap(allUnsynced =>
                            this._storageService.setUserData(
                                Keys.CurrentRideVideosMetadata,
                                JSON.stringify(allUnsynced)
                            )
                        ),
                        map(() => v),
                        catchError(e => {
                            console.log(e);
                            return of(e);
                        })
                    );
                } else {
                    /**
                     * for horse gallery video and existing ride video we don't need to cache the metadata
                     * just add the video to the upload queue and return the media data
                     * */
                    return this._store
                        .dispatch(
                            new AddItemToQueueAction(
                                new MediaUploadItem({
                                    mediaId: v.mediaId,
                                    mediaSubjectId: v.mediaSubjectId,
                                    mediaType: MediaDocumentType.Video,
                                    mediaSubjectType,
                                    mediaCollectionName:
                                        mediaSubjectType === MediaSubjectType.ExistingRideVideo
                                            ? MediaCollectionName.Ride
                                            : MediaCollectionName.Horse,
                                    filePath: mediaData.filePath,
                                    fileSize: mediaData.fileSize,
                                    fileSizeInString: bytesToSize(mediaData.fileSize),
                                    uploadedFileSizeInString: bytesToSize(0)
                                })
                            )
                        )
                        .pipe(map(() => v));
                }
            })
        );
    }

    private _syncHorseGalleryImageThumbnailsCache(): Observable<void> {
        if (!this._currentGalleryImageThumbnailsDownload$) {
            this._currentGalleryImageThumbnailsDownload$ =
                this._downloadHorseGalleryImageThumbnails().pipe(
                    tap(() => (this._currentGalleryImageThumbnailsDownload$ = null)),
                    share()
                );
        }
        return this._currentGalleryImageThumbnailsDownload$;
    }

    private _downloadHorseGalleryImageThumbnails(): Observable<void> {
        return this._horseCache.getHorsesForList().pipe(
            switchMap(details =>
                combineLatest([
                    of(details),
                    this._galleryService.getHorseGalleryMedia(
                        details.map(d => d._id),
                        MediaDocumentType.Image
                    )
                ]).pipe(take(1))
            ),
            map(([details, galleryImageMedia]) =>
                serialSwitchMap(
                    details.map(d =>
                        this._downloadHorseGalleryImageThumbnailsByHorseId(d._id, galleryImageMedia)
                    )
                )
            ),
            switchMap(serial => serial)
        );
    }

    private _downloadHorseGalleryImageThumbnailsByHorseId(
        horseId: string,
        galleryImageMedia: Media[]
    ): Observable<void> {
        return forkJoin([
            this._cachedGalleryImageThumbnailsMetadata(horseId),
            this._galleryImagesRequiringServerThumbnail(horseId)
        ]).pipe(
            map(([cachedMetadata, metadataRequiringThumbnail]) =>
                galleryImageMedia.filter(m => {
                    const horseMatch = m.collectionId === horseId;
                    const absent = !cachedMetadata.find(meta => meta.mediaId === m._id);
                    const needsThumbnail = !!metadataRequiringThumbnail.find(
                        meta => meta.mediaId === m._id
                    );
                    return horseMatch && (absent || needsThumbnail);
                })
            ),
            map(media => {
                const observables: Observable<void>[] = [];
                for (const m of media) {
                    observables.push(
                        this._imageUrlToBlob(m.thumbnail.url).pipe(
                            switchMap(blob => this._setUserImageBlob(m._id, blob, true)),
                            switchMap(() =>
                                // do not filter to avoid truncating data on save
                                this._cachedGalleryImageThumbnailsMetadata().pipe(
                                    map(cached => {
                                        /*
                        Filter out duplicates that can appear from
                        mixing of gallery image metadata list and
                        list of metadata that requires a server-side
                        thumbnail
                    */
                                        const meta = {
                                            mediaId: m._id,
                                            mediaSubjectId: horseId,
                                            galleryCategory: m.galleryCategory
                                                ? m.galleryCategory
                                                : undefined
                                        };
                                        const idx = cached.findIndex(c => c.mediaId === m._id);
                                        if (idx >= 0) {
                                            cached.splice(idx, 1, meta);
                                            return cached;
                                        } else {
                                            return [...cached, meta];
                                        }
                                    }),
                                    switchMap(metadata =>
                                        from(
                                            this._storageService.setUserData(
                                                Keys.GalleryImageThumbnailsMetadata,
                                                JSON.stringify(metadata)
                                            )
                                        ).pipe(map(() => metadata[metadata.length - 1]))
                                    )
                                )
                            ),
                            switchMap(justDownloaded =>
                                // do not filter by horse id to avoid truncating other entries on save
                                this._galleryImagesRequiringServerThumbnail().pipe(
                                    map(needsThumbnail => {
                                        const idx = needsThumbnail.findIndex(
                                            r => r.mediaId === justDownloaded.mediaId
                                        );
                                        if (idx >= 0) {
                                            needsThumbnail.splice(idx, 1);
                                            return needsThumbnail;
                                        } else {
                                            return null;
                                        }
                                    }),
                                    switchMap(spliced =>
                                        !spliced
                                            ? of(undefined)
                                            : from(
                                                  this._storageService.setUserData(
                                                      Keys.GalleryImagesRequiringServerThumbnail,
                                                      spliced
                                                  )
                                              )
                                    )
                                )
                            )
                        )
                    );
                }
                return serialSwitchMap(observables);
            }),
            switchMap(serial => serial)
        );
    }

    private _syncPinActionsCache(): Observable<void> {
        if (!this._currentUnsyncedPinActionsUpload$) {
            this._currentUnsyncedPinActionsUpload$ = this._uploadUnsyncedPinActions().pipe(
                tap(() => (this._currentUnsyncedPinActionsUpload$ = null)),
                share()
            );
        }
        return this._currentUnsyncedPinActionsUpload$;
    }

    private _uploadUnsyncedPinActions(): Observable<void> {
        /*
        needs to done serially because order
        might matter in successive replacements
    */
        return this._unsyncedPinActions().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : of(unsynced).pipe(
                          map(dtos =>
                              serialSwitchMap(dtos.map(dto => this._galleryService.pinMedia(dto)))
                          ),
                          switchMap(serial => serial)
                      )
            )
        );
    }

    private _syncGalleryDeletesCache(): Observable<void> {
        if (!this._currentUnsyncedGalleryDeletesUpload$) {
            this._currentUnsyncedGalleryDeletesUpload$ =
                this._uploadUnsyncedGalleryMediaDeletes().pipe(
                    tap(() => (this._currentUnsyncedGalleryDeletesUpload$ = null)),
                    share()
                );
        }
        return this._currentUnsyncedGalleryDeletesUpload$;
    }

    private _uploadUnsyncedGalleryMediaDeletes(): Observable<void> {
        return this._cachedUnsyncedGalleryMediaToDelete().pipe(
            switchMap(dtos =>
                dtos.length === 0
                    ? of(undefined)
                    : forkJoin([
                          ...dtos.map(dto => this._galleryService.deleteGalleryMedia(dto))
                      ]).pipe(map(() => undefined))
            )
        );
    }

    /*
      Transformations
  */

    private _imageUrlToBlob(url: string): Observable<Blob> {
        return from(fetch(url)).pipe(switchMap(resp => from(resp.blob())));
    }

    private _parseMediaMetadata(json: string): MediaMetadata[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    }

    private _parsePinActions(json: string): PinMediaDto[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    }

    private _parseGalleryDeletes(json: string): DeleteGalleryMediaDto[] {
        const parsed = JSON.parse(json);
        return Array.isArray(json) ? parsed : [];
    }

    public getUserImageUrl(
        mediaId: string,
        thumbnail: boolean = true
    ): Observable<{ url: string; safeUrl: SafeResourceUrl }> {
        return this.getUserImageBlob(mediaId, thumbnail).pipe(
            // filter(blob => !!blob),
            map(blob => {
                if (blob) {
                    return URL.createObjectURL(blob);
                }
                return undefined;
            }),
            map(url => ({
                url,
                safeUrl: this._sanitizer.bypassSecurityTrustResourceUrl(url)
            }))
        );
    }

    private _appendSafeUrlsToMetadata(meta: MediaMetadata[]): Observable<MediaData[]> {
        const observables: Observable<MediaData>[] = meta.map(m =>
            this.getUserImageUrl(m.mediaId).pipe(
                map(imageUrls => ({
                    ...m,
                    safeUrl: imageUrls.safeUrl
                }))
            )
        );
        return forkJoin(observables).pipe(
            defaultIfEmpty([]),
            map(results => {
                let all = [];
                for (const r of results) {
                    all = [...all, r];
                }
                return all;
            })
        );
    }

    /*
      Image Blob Storage
  */

    private _imageBlobKey(mediaId: string, thumbnail: boolean): string {
        const keyType = thumbnail ? Keys.ImageBlobThumbnail : Keys.ImageBlobFull;
        return `${keyType}${mediaId}-`;
    }

    public getUserImageBlob(mediaId: string, thumbnail: boolean): Observable<Blob> {
        return from(this._storageService.getUserData<Blob>(this._imageBlobKey(mediaId, thumbnail)));
    }

    private _setUserImageBlob(mediaId: string, blob: Blob, thumbnail: boolean): Observable<void> {
        return from(
            this._storageService.setUserData<Blob>(this._imageBlobKey(mediaId, thumbnail), blob)
        );
    }

    private _removeUserImageBlob(mediaId: string, thumbnail): Observable<void> {
        return from(this._storageService.clearUserData(this._imageBlobKey(mediaId, thumbnail)));
    }

    /*
      Image Metadata Storage
  */

    private _cachedGalleryImageThumbnailsMetadata(horseId?: string): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.GalleryImageThumbnailsMetadata)).pipe(
            map(json => this._parseMediaMetadata(json)),
            map(metadata =>
                !horseId ? metadata : metadata.filter(m => m.mediaSubjectId === horseId)
            )
        );
    }

    private _cachedUnsyncedGalleryImagesMetadata(horseId?: string): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedGalleryImagesMetadata)).pipe(
            map(json => this._parseMediaMetadata(json)),
            map(metadata =>
                !horseId ? metadata : metadata.filter(m => m.mediaSubjectId === horseId)
            )
        );
    }

    private _allGalleryImagesMetadata(
        concatenate: boolean,
        horseId?: string
    ): Observable<MediaMetadata[] | [MediaMetadata[], MediaMetadata[]]> {
        return forkJoin([
            this._cachedGalleryImageThumbnailsMetadata(horseId),
            this._cachedUnsyncedGalleryImagesMetadata(horseId)
        ]).pipe(
            map(([synced, unsynced]) =>
                concatenate ? [...synced, ...unsynced] : [synced, unsynced]
            )
        );
    }

    private _galleryImagesRequiringServerThumbnail(horseId?: string): Observable<MediaMetadata[]> {
        return from(
            this._storageService.getUserData(Keys.GalleryImagesRequiringServerThumbnail)
        ).pipe(
            map(json => this._parseMediaMetadata(json)),
            map(metadata =>
                !horseId ? metadata : metadata.filter(m => m.mediaSubjectId === horseId)
            )
        );
    }

    private _cachedUnsyncedGalleryMediaToDelete(): Observable<DeleteGalleryMediaDto[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedGalleryMediaToDelete)).pipe(
            map(json => this._parseGalleryDeletes(json))
        );
    }

    private _unsyncedPinActions(): Observable<PinMediaDto[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedPinActions)).pipe(
            map(json => this._parsePinActions(json))
        );
    }

    private _cachedCurrentRideImagesMetadata(): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.CurrentRideImagesMetadata)).pipe(
            map(json => this._parseMediaMetadata(json))
        );
    }

    private _cachedCurrentRideVideosMetadata(): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.CurrentRideVideosMetadata)).pipe(
            map(json => this._parseMediaMetadata(json))
        );
    }

    private _cachedUnsyncedRideImagesMetadata(): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedRideImagesMetadata)).pipe(
            map(json => this._parseMediaMetadata(json))
        );
    }

    private _cachedUnsyncedRideVideosMetadata(): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedRideVideosMetadata)).pipe(
            map(json => this._parseMediaMetadata(json))
        );
    }

    /*
      Video Metadata Storage
  */

    private _cachedUnsyncedGalleryVideosMetadata(): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedGalleryVideosMetadata)).pipe(
            map(json => this._parseMediaMetadata(json))
        );
    }

    private _cachedUnyncedRideVideosMetadata(): Observable<MediaMetadata[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedRideVideosMetadata)).pipe(
            map(json => this._parseMediaMetadata(json))
        );
    }

    private _prepareMediaForUpload(metaData: MediaMetadata[]): Observable<void[]> {
        const observables: Observable<void>[] = [];
        for (const m of metaData) {
            // Image
            if (m.mediaType === MediaDocumentType.Image) {
                observables.push(
                    this._uploadUnsyncedRideImage(m).pipe(
                        switchMap((media: Media) =>
                            this._addMediaToUploadQueue(m, {
                                thumbnailUrl: media.thumbnail.url,
                                isMediaCreatedOnBackend: true
                            })
                        ),
                        catchError(e => {
                            console.log({ _prepareMediaForUpload: e });
                            return of(e);
                        })
                    )
                );
            } else {
                // Video
                observables.push(
                    this._uploadUnsyncedRideVideo(m).pipe(
                        switchMap((media: Media) =>
                            this._videoService
                                .moveRideVideoToThePermanentLocation(m)
                                .pipe(map(updatedMetaData => ({ updatedMetaData, media })))
                        ),
                        tap(({ updatedMetaData }) => {
                            m.filePath = updatedMetaData.newPath;
                        }),
                        switchMap(({ media }: { media: Media }) =>
                            this._mediaService
                                .initiateResumableUpload(m.fileSize)
                                .pipe(map(res => ({ res, media })))
                        ),
                        switchMap(({ res, media }: { res: ResumableMediaUpload; media: Media }) =>
                            this._addMediaToUploadQueue(m, {
                                jwPlayerId: res.jwPlayerId,
                                uploadId: res.uploadId,
                                uploadToken: res.uploadToken,
                                uploadLinks: res.uploadLinks,
                                thumbnailUrl: media.thumbnail.url,
                                isMediaCreatedOnBackend: true
                            })
                        ),
                        catchError(e => {
                            console.log({ _prepareMediaForUpload: e });
                            return of(e);
                        })
                    )
                );
            }
        }

        return forkJoin(observables);
    }

    private _moveMediaMetaDataToUploadQueue(metaData: MediaMetadata[]): Observable<void[]> {
        const observables: Observable<void>[] = [];
        for (const m of metaData) {
            observables.push(
                this._addMediaToUploadQueue(m, {
                    isMediaCreatedOnBackend: false
                })
            );
        }
        return forkJoin(observables);
    }

    private _addMediaToUploadQueue(
        metaData: MediaMetadata,
        extraParams?: Partial<MediaUploadItem>
    ): Observable<void> {
        return this._store.dispatch(
            new AddItemToQueueAction(
                new MediaUploadItem({
                    ...metaData,
                    mediaSubjectId: metaData.mediaSubjectId,
                    fileSizeInString: bytesToSize(metaData.fileSize),
                    uploadedFileSizeInString: bytesToSize(0),
                    ...extraParams
                })
            )
        );
    }
}
