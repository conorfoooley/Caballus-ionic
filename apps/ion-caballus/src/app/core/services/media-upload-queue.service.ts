import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import {
  Media,
  MediaDocumentType,
  MediaService,
  MediaUploadItem,
} from '@caballus/ui-common';
import {
  BehaviorSubject,
  combineLatest,
  from,
  Observable,
  of,
  throwError,
} from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { FileSelectorPlugin } from '@ion-caballus/core/plugins';
import { bytesToSize, getChunkEnd } from '@ion-caballus/core/util';
import { FILE_UPLOAD_CHUNK_SIZE } from '@caballus/common';
import { Store } from '@ngxs/store';
import { CapacitorPluginService } from './capacitor-plugin.service';
import { Platform } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { VideoService } from '@ion-caballus/core/services/video.service';
import { MediaCacheKeys } from '@ion-caballus/core/caches/media/media.cache';
import {
  RemoveItemFromQueueAction,
  SetCurrentUploadingItemAction,
  UpdateItemInQueueAction,
} from '../state/actions';

declare let cordova: any;

enum Keys {
  MediaUpload = 'media-upload-queue-',
}

@Injectable({
  providedIn: 'root',
})
export class MediaUploadQueueService {
  private _isSyncInProcess$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  constructor(
    private readonly _storageService: StorageService,
    private readonly _mediaService: MediaService,
    private readonly _capacitorPluginService: CapacitorPluginService,
    private readonly _toastService: ToastService,
    private readonly _videoService: VideoService,
    private readonly _store: Store,
    private readonly _platform: Platform
  ) {}

  public get isSyncInProcess(): boolean {
    return this._isSyncInProcess$.getValue();
  }

  public remove(itemId: string): Observable<void> {
    return this._store.dispatch(new RemoveItemFromQueueAction(itemId)).pipe(
      map(() => void 0)
    );
  }

  public peek(): Observable<MediaUploadItem> {
    return this.getAll().pipe(map((items) => (items ? items[0] : null)));
  }

  public sync(): Observable<unknown> {
    return this.peek().pipe(
      // takeUntil(this._syncUntil()),
      switchMap((mediaItem) => {
        if (!mediaItem) {
          /**
           * As soon as we have nothing to upload, turn off background mode.
           */
          if (this._platform.is('cordova')) {
            cordova.plugins.backgroundMode.disable();
            cordova.plugins.backgroundMode.setEnabled(false);
          }

          if (this._isSyncInProcess$.getValue()) {
            // reset the isSyncInProcess$
            this._isSyncInProcess$.next(false);
          }

          // reset the current uploading item
          this._store.dispatch(new SetCurrentUploadingItemAction(''));
          return of(undefined);
        }

        const uploadItem: MediaUploadItem = { ...mediaItem };
        this._isSyncInProcess$.next(true);
        // set the current uploading item
        this._store.dispatch(
          new SetCurrentUploadingItemAction(uploadItem.mediaId)
        );

        /**
         * As background mode will slow down app performance,
         * it should only be turned on when there are items in the media upload queue
         * that need to be uploaded.
         */
        /**
         * As soon as we have nothing to upload, turn off background mode.
         */
        if (this._platform.is('cordova')) {
          cordova.plugins.backgroundMode.enable();
          cordova.plugins.backgroundMode.setEnabled(true);
        }

        let observable: Observable<Partial<MediaUploadItem>>;
        if (uploadItem.mediaType === MediaDocumentType.Image) {
          if (uploadItem.isMediaCreatedOnBackend) {
            observable = this._uploadImageMedia(uploadItem);
          } else {
            observable = this._prepareImageMediaForUpload(uploadItem);
          }
        } else {
          if (uploadItem.isMediaCreatedOnBackend) {
            observable = this._uploadVideoMedia(uploadItem);
          } else {
            observable = this._prepareVideoMediaForUpload(uploadItem);
          }
        }

        return observable.pipe(
          switchMap((res) => this._completeUpload(res)),
          switchMap(() => this.sync()),
          catchError((err) => {
            // when upload link expires, try to refresh the link again
            if (err.message === 'FileSelectorPlugin: Link expired!') {
              return this._mediaService
                .refreshUploadLinks(
                  uploadItem.uploadId,
                  uploadItem.uploadToken,
                  uploadItem.fileSize
                )
                .pipe(
                  switchMap((uploadLinks) =>
                    // update uploadLinks
                    this.updateItem({
                      mediaId: uploadItem.mediaId,
                      uploadLinks,
                    }).pipe(
                      switchMap(() =>
                        // start the sync process again
                        this.sync().pipe(
                          catchError((err1) => {
                            console.error(`FileSelectorPlugin: ${err}`);
                            return of(err1);
                          })
                        )
                      )
                    )
                  )
                );
            } else if (err.message === 'FileSelectorPlugin: File not found!') {
              this._toastService.error('Upload file not found!');
              console.error(`FileSelectorPlugin: ${err}`);

              // reset the isSyncInProcess$
              this._isSyncInProcess$.next(false);
              // remove item from queue if file is not available
              return this.remove(uploadItem.mediaId);
            } else {
              // reset the isSyncInProcess$
              this._isSyncInProcess$.next(false);
              console.error(`FileSelectorPlugin: ${err}`);
              return of(err);
            }
          })
        );
      }),
      catchError((err) => {
        this._isSyncInProcess$.next(false);
        console.error(`MediaUploadQueueService: ${err}`);
        return of(err);
      })
    );
  }

  public getAll(): Observable<MediaUploadItem[]> {
    return this._store.selectOnce(
      (s) => s.mediaUploadQueue.mediaFileUploadQueue
    );
  }

  public async getAllFromStorage(): Promise<MediaUploadItem[]> {
    try {
      const items = await this._storageService.getUserData(Keys.MediaUpload);
      return items && items.length ? JSON.parse(items) : [];
    } catch (e) {
      console.error(`MediaUploadQueueService: ${e}`);
    }
  }

  public updateItem(updatedItem: Partial<MediaUploadItem>): Observable<void> {
    return this._store.dispatch(new UpdateItemInQueueAction(updatedItem));
  }

  // update queue
  public async updateQueue(items: MediaUploadItem[]): Promise<void> {
    try {
      await this._storageService.setUserData(
        Keys.MediaUpload,
        JSON.stringify(items)
      );
    } catch (e) {
      console.error(`MediaUploadQueueService: ${e}`);
    }
  }

  private _syncUntil(): Observable<boolean> {
    return combineLatest([
      this._capacitorPluginService.networkStatus(),
      this._store.select((s) => s.user.user.settings.uploadUsingCellularData),
    ]).pipe(
      map(([network, allowCellularUpload]) => {
        if (!network.connected) {
          return false;
        }
        return allowCellularUpload ? true : network.connectionType === 'wifi';
      })
    );
  }

  private _prepareImageMediaForUpload(
    item: MediaUploadItem
  ): Observable<Partial<MediaUploadItem>> {
    return this._getUserImageBlob(item.mediaId, true).pipe(
      switchMap((blob) =>
        this._mediaService.createMedia(
          item.mediaId,
          item.mediaSubjectId,
          blob,
          item.mediaType,
          item.mediaCollectionName,
          item.filePath
        )
      ),
      tap((media: Media) => {
        item.thumbnailUrl = media.thumbnail.url;
        item.isMediaCreatedOnBackend = true;
      }),
      switchMap(() => this._uploadImageMedia(item))
    );
  }

  private _uploadImageMedia(
    item: MediaUploadItem
  ): Observable<Partial<MediaUploadItem>> {
    return this._getUserImageBlob(item.mediaId, false).pipe(
      switchMap((blob) =>
        this._mediaService.completeImageUpload(
          item.mediaId,
          blob
        )
      ),
      map((): Partial<MediaUploadItem> => item),
      catchError((err) => {
        this._toastService.error('Image upload failed!');
        console.log('FileSelectorPlugin: Image upload failed!', err);
        return throwError(err);
      })
    );
  }

  private _prepareVideoMediaForUpload(
    item: MediaUploadItem
  ): Observable<Partial<MediaUploadItem>> {
    return this._getUserImageBlob(item.mediaId, true).pipe(
      switchMap((blob) =>
        this._mediaService.createMedia(
          item.mediaId,
          item.mediaSubjectId,
          blob,
          item.mediaType,
          item.mediaCollectionName,
          item.filePath,
        )
      ),
      tap((media) => {
        item.isMediaCreatedOnBackend = true;
        item.thumbnailUrl = media.thumbnail.url;
      }),
      switchMap(() =>
        this._videoService.moveRideVideoToThePermanentLocation(item)
      ),
      tap(({ newPath }) => {
        item.filePath = newPath;
      }),
      switchMap(() => this._mediaService.initiateResumableUpload(item.fileSize)),
      tap((res) => {
        item.uploadId = res.uploadId;
        item.uploadToken = res.uploadToken;
        item.uploadLinks = res.uploadLinks;
        item.jwPlayerId = res.jwPlayerId;
      }),
      switchMap(() => this._uploadVideoMedia(item))
    );
  }

  private _uploadVideoMedia(
    item: MediaUploadItem
  ): Observable<Partial<MediaUploadItem>> {
    return from(
      FileSelectorPlugin.UploadVideoFile({
        filePath: item.filePath,
        uploadLink: item.uploadLinks.at(item.lastUploadedPart + 1),
        lastUploadedPart: item.lastUploadedPart,
        mediaId: item.mediaId,
        fileSize: item.fileSize,
        start: item.uploadedBytes,
        end: getChunkEnd(
          item.uploadedBytes,
          FILE_UPLOAD_CHUNK_SIZE,
          item.fileSize
        ),
      })
    ).pipe(map((res) => ({  ...item, ...res, })));
  }

  private _getUserImageBlob(
    mediaId: string,
    thumbnail: boolean
  ): Observable<Blob> {
    const imageBlobKey = `${
      thumbnail
        ? MediaCacheKeys.ImageBlobThumbnail
        : MediaCacheKeys.ImageBlobFull
    }${mediaId}-`;
    return from(this._storageService.getUserData<Blob>(imageBlobKey));
  }

  private _completeUpload(
    updatedItem: Partial<MediaUploadItem>
  ): Observable<void> {
    return this.getAll().pipe(
      map((items) =>
        items.find((item) => item.mediaId === updatedItem.mediaId)
      ),
      switchMap((matchedItem) => {
        if (matchedItem) {
          // verify if file is completely uploaded
          const isFileUploaded =
            matchedItem.mediaType === MediaDocumentType.Image
              ? true
              : updatedItem.uploadedBytes >= matchedItem.fileSize;

          // prepare object to update
          const objToUpdate: Partial<MediaUploadItem> = {
            ...matchedItem,
            ...updatedItem,
            lastUploadedPart: matchedItem.lastUploadedPart + 1,
            uploadedFileSizeInString: bytesToSize(updatedItem.uploadedBytes),
          };

          // verify if file is uploaded
          if (isFileUploaded) {
            if (matchedItem.mediaType === MediaDocumentType.Video) {
              return this.updateItem(objToUpdate).pipe(
                switchMap(() =>
                  // complete the upload
                  this._mediaService.completeResumableUpload(
                    objToUpdate.uploadId,
                    objToUpdate.uploadToken,
                    objToUpdate.mediaId,
                    objToUpdate.jwPlayerId
                  )
                ),
                switchMap(() =>
                  // remove file from the device
                  from(
                    FileSelectorPlugin.RemoveVideoFile({
                      filePath: objToUpdate.filePath,
                    })
                  )
                ),
                switchMap(() =>
                  // remove file from the queue
                  this.remove(objToUpdate.mediaId)
                )
              );
            } else {
              // remove file from the queue
              return this.remove(objToUpdate.mediaId);
            }
          } else {
            // update the item in the queue
            return this.updateItem(objToUpdate);
          }
        }
        return of(null);
      }),
      catchError((err) => {
        console.error(`FileSelectorPlugin: ${err}`);
        return of(err);
      })
    );
  }
}
