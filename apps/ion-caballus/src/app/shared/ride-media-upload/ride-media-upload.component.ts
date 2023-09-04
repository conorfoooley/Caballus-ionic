import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import {
    BaseMediaDocument,
    Media,
    MediaDocumentType,
    MediaSelectionSource,
    MediaSubjectType,
    ModalService,
    Ride
} from '@caballus/ui-common';
import {
    CameraDirection,
    CameraResultType,
    CameraSource,
    ImageOptions,
    Photo
} from '@capacitor/camera';
import { ToastService } from '@rfx/ngx-toast';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { createObjectID } from 'mongo-object-reader';
import { catchError, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MediaCache } from '@ion-caballus/core/caches';
import {
    CapacitorPluginService,
    ModalService as CoreModalService,
    ThumbnailService
} from '@ion-caballus/core/services';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { isNil } from 'lodash';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Component({
    selector: 'app-ride-media-upload',
    templateUrl: './ride-media-upload.component.html',
    styleUrls: ['./ride-media-upload.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideMediaUploadComponent implements OnInit, OnDestroy, OnChanges {
    @Input() public ride: Ride;
    @Input() public rideMedia: Media[];
    @Input() public doesUserHaveActiveSubscription: boolean;
    @Input() public isCurrentRide = true;
    @Input() public addingFromManualRideEntryPage = false;
    @Output() public media: EventEmitter<Media[]> = new EventEmitter<Media[]>();

    private _onDestroy$: Subject<void> = new Subject<void>();
    private _attachedMedia: Media[] = [null, null, null, null, null];
    private _handleAttachedMediaTap$: Subject<number> = new Subject<number>();

    public thumbnails$: ReplaySubject<SafeResourceUrl[]> = new ReplaySubject(1);
    private _isWeb = false;

    constructor(
        private readonly _mediaCache: MediaCache,
        private readonly _toastService: ToastService,
        private readonly _modalService: ModalService,
        private readonly _coreModalService: CoreModalService,
        private readonly _thumbnailService: ThumbnailService,
        private readonly _capacitorPluginService: CapacitorPluginService,
        private readonly _sanitizer: DomSanitizer,
        private readonly _platform: Platform
    ) {}

    public ngOnInit(): void {
        this._isWeb = !this._platform.is('cordova');

        this._updateThumbnails();
        this._handleAttachedMediaTap$
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(ix => {
                    const attachedMedia: Media = this._attachedMedia[ix];
                    if (attachedMedia !== null) {
                        return this._coreModalService
                            .mediaPreview(
                                'Remove Media?',
                                attachedMedia.latest.type === MediaDocumentType.Image
                                    ? attachedMedia.latest.url
                                    : attachedMedia.latest.safeUrl,
                                attachedMedia.latest.type === MediaDocumentType.Video,
                                attachedMedia.latest.jwPlayerId,
                                'Remove'
                            )
                            .pipe(
                                switchMap(confirm =>
                                    confirm ? this._removeAttachedMedia(ix) : of(undefined)
                                ),
                                tap(_ => this._updateThumbnails()),
                                tap(_ => this.media.next(this._attachedMedia)),
                                map(_ => false)
                            );
                    }
                    return of(true);
                }),
                filter(_continue => _continue),
                switchMap(() =>
                    this._modalService
                        .media(this._isWeb ? 'Add Photo' : 'Add Photo Or Video', this._isWeb)
                        .afterClosed()
                        .pipe(
                            map(response => ({
                                cancelled: response === undefined,
                                source: response
                            }))
                        )
                ),
                filter(modalResponse => !modalResponse.cancelled),
                switchMap(modalResponse => {
                    // PICK_PHOTO & TAKE_PHOTO & check for permissions
                    if (
                        [MediaSelectionSource.PICK_PHOTO, MediaSelectionSource.TAKE_PHOTO].includes(
                            modalResponse.source
                        )
                    ) {
                        const source: CameraSource =
                            modalResponse.source === MediaSelectionSource.PICK_PHOTO
                                ? CameraSource.Photos
                                : CameraSource.Camera;
                        return this._handlePermissions(source, modalResponse);
                    }
                    // PICK_VIDEO & TAKE_VIDEO & check for permissions
                    if (
                        [MediaSelectionSource.PICK_VIDEO, MediaSelectionSource.TAKE_VIDEO].includes(
                            modalResponse.source
                        )
                    ) {
                        const source: CameraSource =
                            modalResponse.source === MediaSelectionSource.PICK_VIDEO
                                ? CameraSource.Photos
                                : CameraSource.Camera;
                        return this._handlePermissions(source, modalResponse);
                    }
                    return of({
                        ...modalResponse,
                        cancelled: true
                    });
                }),
                filter(modalResponse => !modalResponse.cancelled),
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
                            // verify if user have active subscription
                            if (!this.doesUserHaveActiveSubscription) {
                                this._toastService.error(
                                    'Only Subscribers can add videos. Become a subscriber by going to the My Accounts section of the app.'
                                );
                                return of(null);
                            }
                            return this._handleVideoAttachment();
                        default:
                            break;
                    }
                }),
                filter(media => !!media),
                switchMap(media => this._addAttachedMedia(media)),
                tap(_ => this._updateThumbnails()),
                tap(_ => this.media.next(this._attachedMedia))
            )
            .subscribe();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.rideMedia) {
            if (changes.rideMedia.currentValue.length) {
                for (let i = 0; i < changes.rideMedia.currentValue.length; i++) {
                    if (isNil(this._attachedMedia[i])) {
                        this._attachedMedia[i] = changes.rideMedia.currentValue[i];
                    }
                }
            } else {
                this._attachedMedia = [null, null, null, null, null];
            }
            this._updateThumbnails();
        }
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public onTapAttachedMedia(ix: number): void {
        this._handleAttachedMediaTap$.next(ix);
    }

    private _updateThumbnails(): void {
        this.thumbnails$.next(this._attachedMedia.map(i => (i ? i.thumbnail.safeUrl : null)));
    }

    private _addAttachedMedia(media: Media): Observable<void> {
        return of(undefined).pipe(
            map(_ => this._attachedMedia.findIndex(i => i === null)),
            tap(target => (target > -1 ? (this._attachedMedia[target] = media) : undefined)),
            map(_ => undefined)
        );
    }

    private _removeAttachedMedia(ix: number): Observable<void> {
        // Remove from cache and then from the attached media array
        return this._mediaCache.removeCurrentRideMediaByMediaId(this._attachedMedia[ix]).pipe(
            tap(_ => this._attachedMedia.splice(ix, 1)),
            tap(_ => this._attachedMedia.push(null))
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
        return this._mediaCache
            .addRidePhoto(
                this.ride._id,
                imageOptions,
                this.isCurrentRide
                    ? MediaSubjectType.CurrentRideImage
                    : MediaSubjectType.ExistingRideImage
            )
            .pipe(
                filter(res => !!res),
                map(
                    photo =>
                        new Media({
                            _id: photo.mediaId,
                            latest: new BaseMediaDocument({
                                url: photo.dataUrl,
                                safeUrl: this._sanitizer.bypassSecurityTrustResourceUrl(
                                    photo.dataUrl
                                ),
                                type: MediaDocumentType.Image
                            }),
                            thumbnail: new BaseMediaDocument({
                                type: MediaDocumentType.Image,
                                safeUrl: this._sanitizer.bypassSecurityTrustResourceUrl(
                                    photo.thumbnailDataUrl
                                ),
                                url: this._thumbnailService.base64ToDataUrl({
                                    base64String: photo.thumbnailDataUrl,
                                    format: 'jpeg'
                                } as Photo)
                            })
                        })
                )
            );
    }

    private _handleVideoAttachment(): Observable<Media> {
        return this._capacitorPluginService.getVideoAttachment().pipe(
            filter(res => !!res),
            switchMap(res =>
                this._mediaCache.addRideVideo(
                    {
                        mediaSubjectId: this.ride._id,
                        mediaId: createObjectID(),
                        dataUrl: Capacitor.convertFileSrc(res.originalFilePath),
                        thumbnailDataUrl: res.thumbnail,
                        mediaType: MediaDocumentType.Video,
                        safeUrl: this._sanitizer.bypassSecurityTrustUrl(
                            Capacitor.convertFileSrc(res.originalFilePath)
                        ),
                        filePath: res.originalFilePath,
                        fileSize: res.fileSize
                    },
                    this.isCurrentRide
                        ? MediaSubjectType.CurrentRideVideo
                        : MediaSubjectType.ExistingRideVideo
                )
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
                        })
                    })
            ),
            catchError(err => {
                this._toastService.error('Add video to the ride failed');
                console.log('Add video err', err);
                return of(err);
            })
        );
    }

    private _handlePermissions(
        source: CameraSource.Camera | CameraSource.Photos,
        modalResponse: { cancelled: boolean; source: MediaSelectionSource }
    ) {
        return this._capacitorPluginService.checkPermissions(source).pipe(
            switchMap(permission => {
                if (!permission) {
                    return this._capacitorPluginService
                        .requestCameraPermission(
                            source === CameraSource.Camera ? 'camera' : 'photos'
                        )
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
}
