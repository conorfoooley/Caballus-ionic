import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Media,
  GallerySortByOption,
  GalleryService,
  MediaDocumentType,
  GalleryCategory,
  ModalService,
  MediaSelectionSource,
  ToastService,
} from '@caballus/ui-common';
import { BaseMediaDocument, dataURItoBlob } from '@caballus/common';
import { MediaCache } from '@ion-caballus/core/caches';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap, take, filter, tap, catchError } from 'rxjs/operators';
import {
  CapacitorPluginService,
  ModalService as CoreModalService,
} from '@ion-caballus/core/services';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { createObjectID } from 'mongo-object-reader';
import { CameraDirection, CameraResultType, CameraSource, ImageOptions } from '@capacitor/camera';
import { AlertController, Platform } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
const ALERT_DISMISS_TIME = 5000;
@Component({
  selector: 'app-horse-photo-gallery',
  templateUrl: './horse-photo-gallery.component.html',
  styleUrls: ['./horse-photo-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorseProfileGalleryComponent implements OnInit {
  public readonly GallerySortByOption: typeof GallerySortByOption =
    GallerySortByOption;
  public readonly GalleryCategory: typeof GalleryCategory = GalleryCategory;
  public readonly MediaDocumentType: typeof MediaDocumentType =
    MediaDocumentType;

  private _alertShowed = false;

  private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
    map((params) => params.get('horseId')),
    shareReplay(1)
  );

  private _flow$: Observable<string> = this._activatedRoute.paramMap.pipe(
    map((params) => params.get('flow')),
    shareReplay(1)
  );

  public horseMedia$: BehaviorSubject<Media[]> = new BehaviorSubject(null);

  private _isWeb = false;
  private _currentFlow: string;

  constructor(
    private readonly _router: Router,
    private readonly _mediaCache: MediaCache,
    private readonly _toastService: ToastService,
    private readonly _modalService: ModalService,
    private readonly _coreModalService: CoreModalService,
    private readonly _capacitorPluginService: CapacitorPluginService,
    private readonly _sanitizer: DomSanitizer,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _galleryService: GalleryService,
    private readonly _alertController: AlertController,
    private readonly _loader: LoadingController,
    private readonly _platform: Platform
  ) {}

  public attachmentUrl: SafeResourceUrl;

  public attachment: Blob;

  public horseId: string;

  public ngOnInit(): void {
    this._isWeb = !this._platform.is('cordova');

    this._horseId$
      .pipe(
        take(1),
        filter((id) => !!id),
        switchMap((id) => {
          this.horseId = id;
          return this.getHorseMedia(id);
        })
      )
      .subscribe();
    this._flow$.subscribe((_flow) => {
      this._currentFlow = _flow;
    });
  }

  private async getHorseMedia(
    id: string,
    sortOrder?: GallerySortByOption
  ): Promise<void> {
    this._galleryService
      .getHorseGalleryMedia([id], undefined, sortOrder)
      .subscribe((photos) => {
        if (!this._alertShowed) {
          if (this._currentFlow === 'pin-media') {
            if (photos?.length) {
              this._showAlert(
                'Please Select the Image.  Only images and videos in the gallery are displayed for this purpose.'
              );
            } else {
              this._showAlert(
                'There are no images to select.  Please add images to the media gallery so you can select them.' +
                  ' Note that you can only pin images (not video) to the horse profile.'
              );
            }
          }
          this._alertShowed = true;
        }
        this.horseMedia$.next(photos);
      });
  }

  public goBack(): void {
    this._router.navigateByUrl(
      `/tabs/horse-profile/detail-horse/general-tab/${this.horseId}`
    );
  }

  public uploadProfilePicture(url: Blob): void {
    let loader;
    this._loader
      .create({
        message: 'Uploading profile picture...',
      })
      .then((data) => {
        loader = data;
        loader.present();
        this._galleryService
          .uploadImageToHorseProfile(this.horseId, url)
          .subscribe(() => {
            this.getHorseMedia(this.horseId);
            loader.dismiss();
            this.goBack();
          });
      });
  }

  public attachMedia(): void {
    this._modalService
      .media(this._isWeb ? 'Add Photo' : 'Add Photo Or Video', this._isWeb)
      .afterClosed()
      .pipe(
        map((response) => ({
          cancelled: response === undefined,
          source: response,
        })),
        filter((modalResponse) => !modalResponse.cancelled),
        switchMap((modalResponse) => {
          // PICK_PHOTO & TAKE_PHOTO & check for permissions
          if (
            [
              MediaSelectionSource.PICK_PHOTO,
              MediaSelectionSource.TAKE_PHOTO,
            ].includes(modalResponse.source)
          ) {
            const source: CameraSource =
              modalResponse.source === MediaSelectionSource.PICK_PHOTO
                ? CameraSource.Photos
                : CameraSource.Camera;
            return this._handlePermissions(source, modalResponse);
          }
          // PICK_VIDEO & TAKE_VIDEO & check for permissions
          if (
            [
              MediaSelectionSource.PICK_VIDEO,
              MediaSelectionSource.TAKE_VIDEO,
            ].includes(modalResponse.source)
          ) {
            const source: CameraSource =
              modalResponse.source === MediaSelectionSource.PICK_VIDEO
                ? CameraSource.Photos
                : CameraSource.Camera;
            return this._handlePermissions(source, modalResponse);
          }
          return of({
            ...modalResponse,
            cancelled: true,
          });
        }),
        filter((modalResponse) => !modalResponse.cancelled),
        switchMap(modalResponse => {
          switch (modalResponse.source) {
            // Get from gallery
            case MediaSelectionSource.PICK_PHOTO:
              return this._handlePhotoAttachment(MediaSelectionSource.PICK_PHOTO);
            // Get from camera
            case MediaSelectionSource.TAKE_PHOTO:
              return this._handlePhotoAttachment(MediaSelectionSource.TAKE_PHOTO);
            // Get from gallery
            case MediaSelectionSource.PICK_VIDEO:
              return this._handleVideoAttachment();
            default:
              break;
          }
        }),
      )
      .subscribe(media => {
        if (media) {
          this.horseMedia$.next([
            ...this.horseMedia$.getValue(),
            media,
          ]);
        }
      });
  }

  public changeSortingOrder(e): void {
    const sortOption = e;
    switch (sortOption.value) {
      case GallerySortByOption.NewestToOldest:
        this.getHorseMedia(this.horseId, GallerySortByOption.NewestToOldest);
        break;
      case GallerySortByOption.OldestToNewest:
        this.getHorseMedia(this.horseId, GallerySortByOption.OldestToNewest);
        break;
      case GallerySortByOption.Pinned:
        this.getHorseMedia(this.horseId, GallerySortByOption.Pinned);
        break;
      default:
        break;
    }
  }

  public pinMedia(mediaId): void {
    this._galleryService
      .pinMedia({ horseId: this.horseId, mediaToPin: mediaId })
      .subscribe(() => {
        this.getHorseMedia(this.horseId);
      });
  }

  public imageViewerModal(attachmentUrl: string, mediaId: string, isPinned: boolean): void {
    if (!attachmentUrl) {
      return;
    }
    if (this._currentFlow === 'pin-media') {
      this.pinMedia(mediaId);
    } else if (this._currentFlow === 'profile-image') {
      this.changeUserImage(attachmentUrl);
    } else {
      this._coreModalService
        .imageViewerModal(attachmentUrl, mediaId, this.horseId, isPinned)
        .pipe(
          take(1),
          tap(() => this.getHorseMedia(this.horseId))
        )
        .subscribe();
    }
  }

  public async changeUserImage(profilePictureInput: string): Promise<void> {
    try {
      // get uploaded image
      fetch(profilePictureInput)
        .then((res) => res.blob()) // Gets the response and returns it as a blob
        .then(async (blob) => {
          const url = this._sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(blob)
          );

          // show image cropper modal
          const cropper = await this._coreModalService.profileImageCropperModal(
            url
          );
          const cropperRes = await cropper.onDidDismiss();

          if (cropperRes && cropperRes.data) {
            const newProfileBlob = dataURItoBlob(cropperRes.data);
            // update profile picture
            await this.uploadProfilePicture(newProfileBlob);
          }
        });
    } catch (e) {
      console.error(e);
    }
  }

  private _handlePermissions(source: CameraSource.Camera | CameraSource.Photos, modalResponse:
    { cancelled: boolean, source: MediaSelectionSource }) {
    return this._capacitorPluginService.checkPermissions(source).pipe(
      switchMap(permission => {
        if (!permission) {
          return this._capacitorPluginService
            .requestCameraPermission(source === CameraSource.Camera ? 'camera' : 'photos')
            .pipe(
              map(result => {
                if (!result) {
                  this._toastService.info(
                    'Please go to your phone settings to allow Caballus access to your photos or videos'
                  );
                  modalResponse.cancelled = true;
                }

                return modalResponse;
              })
            );
        }
        return of(modalResponse);
      })
    );
  }

  private _handlePhotoAttachment(source: MediaSelectionSource): Observable<Media> {
    const imageOptions: ImageOptions = {
      source:
        source === MediaSelectionSource.PICK_PHOTO
          ? CameraSource.Photos
          : CameraSource.Camera,
      resultType: CameraResultType.DataUrl,
      allowEditing: false,
      saveToGallery: source === MediaSelectionSource.TAKE_PHOTO,
      ...(source === MediaSelectionSource.TAKE_PHOTO && {
        direction: CameraDirection.Rear,
        correctOrientation: true
      })
    };

    return this._mediaCache.addGalleryPhoto(this.horseId, imageOptions).pipe(
      filter(res => !!res),
      map(
        photo =>
          new Media({
            _id: photo.mediaId,
            latest: new BaseMediaDocument({
              url: photo.dataUrl,
              safeUrl: this._sanitizer.bypassSecurityTrustResourceUrl(photo.dataUrl),
              type: MediaDocumentType.Image
            }),
            thumbnail: new BaseMediaDocument({
              type: MediaDocumentType.Image,
              safeUrl: this._sanitizer.bypassSecurityTrustResourceUrl(
                photo.thumbnailDataUrl
              ),
              url: photo.thumbnailDataUrl
            }),
            isUploaded: false,
          })
      )
    );
  }

  private _handleVideoAttachment(): Observable<Media> {
    return this._capacitorPluginService.getVideoAttachment().pipe(
      filter(res => !!res),
      switchMap(res =>
        this._mediaCache.addGalleryVideo({
          mediaSubjectId: this.horseId,
          mediaId: createObjectID(),
          dataUrl: Capacitor.convertFileSrc(res.originalFilePath),
          thumbnailDataUrl: res.thumbnail,
          mediaType: MediaDocumentType.Video,
          safeUrl: this._sanitizer.bypassSecurityTrustUrl(
            Capacitor.convertFileSrc(res.originalFilePath)
          ),
          filePath: res.originalFilePath,
          fileSize: res.fileSize
        })
      ),
      map(
        res =>
          new Media({
            _id: res.mediaId,
            latest: new BaseMediaDocument({
              url: res.filePath,
              safeUrl: res.safeUrl,
              type: MediaDocumentType.Video
            }),
            thumbnail: new BaseMediaDocument({
              type: MediaDocumentType.Image,
              safeUrl: this._sanitizer.bypassSecurityTrustResourceUrl(
                res.thumbnailDataUrl
              ),
              url: res.thumbnailDataUrl
            }),
            isUploaded: false
          })
      ),
      catchError(err => {
        this._toastService.error('Add video to the ride failed');
        console.log('Add video err', err);
        return of(err);
      })
    );
  }

  private async _showAlert(msg: string): Promise<void> {
    const alert = await this._alertController.create({
      message: msg,
      buttons: ['OK'],
    });
    await alert.present();
    setTimeout(() => {
      alert.dismiss();
    }, ALERT_DISMISS_TIME);
  }

}
