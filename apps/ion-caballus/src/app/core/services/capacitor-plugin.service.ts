import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ConnectionStatus, Network } from '@capacitor/network';
import { Camera, CameraResultType, CameraSource, ImageOptions, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { defer, from, Observable, Observer, of } from 'rxjs';
import { catchError, map, share, switchMap } from 'rxjs/operators';
import { CameraPermissionType } from '@capacitor/camera/dist/esm/definitions';
import { Camera as Camera2, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { FileSelectorPlugin } from '@ion-caballus/core/plugins';
import { base64ToDataUrl, BYTES_PER_MB, THOUSAND, THUMBNAIL_PIXEL_DIMENSIONS } from '@caballus/common';
import { Video } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { ThumbnailService } from '@ion-caballus/core/services/thumbnail.service';

const DEFAULT_PHOTO_QUANTITY = 60;
export const ERR_NOT_AUTHORIZED = 'NOT_AUTHORIZED';
export const ERR_NO_LOCATION_PERMISSION = 'Location permissions required for Map my Ride';
const CAMERA_PERMISSIONS_GRANTED: string = 'granted';

export const DEFAULT_IMAGE_OPTIONS: ImageOptions = {
  quality: 50,
  width: 2160,
  height: 2160,
  allowEditing: true,
  resultType: CameraResultType.DataUrl,
  saveToGallery: false
};

/*
    Service allows access to plugin features
    though dependency injection in place of
    direct imports, which helps with testing
    of other classes because the provider can
    be overridden with a mock implementation
*/
@Injectable({ providedIn: 'root' })
export class CapacitorPluginServiceShim {
  public networkStatus$: Observable<ConnectionStatus>;

  constructor() {
    this.networkStatus$ = defer(() => this._createNetworkStatusStream()).pipe(share());
  }

  public networkStatus(): Observable<ConnectionStatus> {
    return from(Network.getStatus());
  }

  public getPhoto(options: ImageOptions): Promise<Photo> {
    return Camera.getPhoto(options);
  }

  public async checkPermissions(source?: CameraSource): Promise<boolean> {
    const permissions = await Camera.checkPermissions();
    if (source === CameraSource.Camera) {
      return permissions.camera === CAMERA_PERMISSIONS_GRANTED;
    } else if (source === CameraSource.Photos) {
      return permissions.photos === CAMERA_PERMISSIONS_GRANTED;
    }
    return (
      permissions.camera === CAMERA_PERMISSIONS_GRANTED &&
      permissions.photos === CAMERA_PERMISSIONS_GRANTED
    );
  }

  public async requestCameraPermission(permissionType: CameraPermissionType): Promise<boolean> {
    const permissions = await Camera.requestPermissions({
      permissions: [permissionType]
    });
    if (permissionType === 'camera') {
      return permissions.camera === CAMERA_PERMISSIONS_GRANTED;
    }
    return permissions.photos === CAMERA_PERMISSIONS_GRANTED;
  }

  private _createNetworkStatusStream(): Observable<ConnectionStatus> {
    return new Observable(subscriber => {
      const handle = Network.addListener('networkStatusChange', event => {
        subscriber.next(event);
      });

      // Get initial status
      Network.getStatus().then(status => subscriber.next(status));

      return () => {
        handle.remove();
      };
    });
  }
}

@Injectable({ providedIn: 'root' })
export class CapacitorPluginService {
  constructor(
    private readonly _platform: Platform,
    private readonly _shim: CapacitorPluginServiceShim,
    private readonly _toastService: ToastService,
    private readonly _thumbnailService: ThumbnailService
  ) {
  }

  public async getAttachment(fileInput?: HTMLInputElement, quality?: number): Promise<Blob> {
    // const { Camera } = Plugins;
    if (this._platform.is('cordova')) {
      const image = await Camera.getPhoto({
        quality: quality || DEFAULT_PHOTO_QUANTITY,
        resultType: CameraResultType.Base64,
        allowEditing: false,
      });

      // Read into Blob
      const bytes = [];
      const buffer = atob(image.base64String);
      for (let i = 0; i < buffer.length; i++) {
        bytes.push(buffer.charCodeAt(i));
      }
      return new Blob([new Uint8Array(bytes)], {
        // Capacitor camera currently only outputs jpeg
        type: 'image/jpeg'
      });
    } else {
      if (fileInput) {
        return new Promise<Blob>((resolve, reject): void => {
          const orgOnChange = fileInput.onchange;
          fileInput.onchange = (_): void => {
            fileInput.onchange = orgOnChange;
            if (fileInput.files.length > 0) {
              const file = fileInput.files.item(0);
              resolve(file);
            } else {
              reject();
            }
          };
          fileInput.click();
        });
      } else {
        return null;
      }
    }
  }

  public networkStatus(): Observable<ConnectionStatus> {
    return this._shim.networkStatus();
  }

  public getPhoto(options: ImageOptions = DEFAULT_IMAGE_OPTIONS): Observable<Photo> {
    return from(this._shim.getPhoto(options));
  }

  public checkPermissions(source?: CameraSource): Observable<boolean> {
    return from(this._shim.checkPermissions(source));
  }

  public requestCameraPermission(permissionType: CameraPermissionType): Observable<boolean> {
    return from(this._shim.requestCameraPermission(permissionType));
  }

  public isNativeAppPlatform(): {
    platform: string;
    isNative: boolean;
  } {
    return {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform()
    };
  }

  public getVideoAttachment(): Observable<{
    originalFilePath: string;
    thumbnail: string;
    fileSize: number;
  }> {
    if (Capacitor.isNativePlatform()) {
      const camera = new Camera2();
      const cameraOptions: CameraOptions = {
        destinationType: camera.DestinationType.FILE_URI,
        mediaType: camera.MediaType.VIDEO,
        sourceType: camera.PictureSourceType.PHOTOLIBRARY
      };
      return from(camera.getPicture(cameraOptions)).pipe(
        switchMap((filePath: string) =>
          from(
            FileSelectorPlugin.GeneRateThumbnail({
              filePath
            })
          ).pipe(
            map(res => ({
              originalFilePath: filePath,
              thumbnail: base64ToDataUrl(res.thumbnail),
              fileSize: res.fileSize
            })),
            catchError(err => {
              console.log(err);
              return of(err);
            })
          )
        ),
        catchError(err => {
          console.log(err);
          return of(null);
        })
      );
    } else {
      const fileInput: HTMLInputElement = document.createElement('INPUT') as HTMLInputElement;
      fileInput.hidden = true;
      fileInput.setAttribute('type', 'file');
      fileInput.setAttribute('id', 'filePicker');
      fileInput.setAttribute('accept', 'video/*');
      fileInput.setAttribute('multiple', 'true');

      return new Observable(
        (
          observer: Observer<{
            originalFilePath: string;
            thumbnail: string;
            fileSize: number;
          }>
        ): void => {
          const orgOnChange = fileInput.onchange;
          fileInput.onchange = (_): void => {
            fileInput.onchange = orgOnChange;
            if (fileInput.files.length > 0) {
              const item = fileInput.files.item(0);
              if (item.size >= BYTES_PER_MB * THOUSAND) {
                this._toastService.error(
                  'The maximum size allowed for an uploaded file is 1 GB.'
                );
                observer.error(null);
              }

              // generate thumbnail
              this._thumbnailService
                .getVideoThumbnail(
                  {
                    blob: (): Promise<Blob> =>
                      Promise.resolve(fileInput.files.item(0))
                  } as Video,
                  THUMBNAIL_PIXEL_DIMENSIONS,
                  THUMBNAIL_PIXEL_DIMENSIONS
                )
                .subscribe(
                  urlString => {
                    const {
                      thumbnailDataUrl,
                      dataUrl
                    }: {
                      thumbnailDataUrl: string;
                      dataUrl: string;
                    } = JSON.parse(urlString);
                    // emit the result
                    observer.next({
                      thumbnail: thumbnailDataUrl,
                      originalFilePath: dataUrl,
                      fileSize: item.size
                    });
                    // complete the observable
                    observer.complete();
                  },
                  error => {
                    observer.error(error);
                  }
                );
            } else {
              observer.error({});
            }
          };
          fileInput.onerror = (e): void => {
            observer.error('File upload failed');
          };
          fileInput.click();
        }
      );
    }
  }
}
