import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ToggleHorseToRideModalComponent } from '../modals/toggle-horse-to-ride-modal/toggle-horse-to-ride-modal.component';
import { QuickAddHorseModalComponent } from '../modals/quick-add-horse-modal/quick-add-horse-modal.component';
import { OccupiedHorseModalComponent } from '../modals/occupied-horse-modal/occupied-horse-modal.component';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import {
    BaseMediaDocument,
    Friend,
    HorseEvaluationSimple,
    HorseEvaluationType,
    HorseForRide,
    HorseHealthSimple,
    HorseHealthType,
    HorseMatrixSimple,
    HorseMatrixType,
    HorseProfileStatus,
    Media,
    Notification,
    Ride,
    UserProfile
} from '@caballus/ui-common';
import { DeleteHorseModalComponent } from '../modals/delete-horse-modal/delete-horse-modal.component';
import { DisableHorseModalComponent } from '../modals/disable-horse-modal/disable-horse-modal.component';
import { HorseProfileImageModalComponent } from '../modals/horse-profile-image-modal/horse-profile-image-modal.component';
import { HorseCompetitionImageModalComponent } from '../modals/horse-competition-image-modal/horse-competition-image-modal.component';
import { MediaPreviewModalComponent } from '../modals/media-preview-modal/media-preview-modal.component';
import { HorseHealthModalComponent } from '../modals/horse-health-modal/horse-health-modal.component';
import { UnsavedChangeModalComponent } from '../modals/unsaved-changes-modal/unsaved-changes-modal.component';
import { ImageViewer } from '../modals/image-viewer/image-viewer.component';
import { HorseMatrixModalComponent } from '../modals/horse-matrix-modal/horse-matrix-modal.component';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ProfileImageCropperComponent } from '../modals/profile-image-cropper/profile-image-cropper.component';
import { AddFriendModalComponent } from '../modals/add-friend-modal/add-friend-modal.component';
import { ConfigureGpsParametersModalComponent } from '../modals/configure-gps-parameters-modal/configure-gps-parameters-modal.component';
import { AlreadyFriendModalComponent } from '../modals/already-friend-modal/already-friend-modal.component';
import { FriendRequestModalComponent } from '../modals/friend-request-modal/friend-request-modal.component';
import { NotificationModalComponent } from '../modals/notification-modal/notification-modal.component';
import { FriendStatus } from '@caballus/common';
import { PromptMsgModalComponent } from '../modals/prompt-msg-modal/prompt-msg-modal.component';
import { FriendActionModalComponent } from '../modals/friend-action-modal/friend-action-modal.component';
import { EndRideShareModalComponent } from '../modals/end-ride-share-modal/end-ride-share-modal.component';
import { DeleteIncompleteRideModalComponent } from '../modals/delete-incomplete-ride-modal/delete-incomplete-ride-modal.component';
import { VideoViewerModalComponent } from '../modals/video-viewer-modal/video-viewer-modal.component';

@Injectable({ providedIn: 'root' })
export class ModalService {
    constructor(private readonly _modalController: ModalController) {}

    public notificationView(notification: Notification): Observable<{ markAsRead: boolean }> {
        const promise = this._modalController.create({
            cssClass: ['generic-ion-modal', 'notification-modal'],
            component: NotificationModalComponent,
            componentProps: {
                notification
            }
        });

        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public friendAction(friendRequest: Friend): Observable<{ status: FriendStatus }> {
        const promise = this._modalController.create({
            cssClass: ['generic-ion-modal'],
            component: FriendActionModalComponent,
            componentProps: {
                friendRequest
            }
        });

        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public toggleHorseToRide(horse: HorseForRide, add: boolean): Observable<boolean> {
        const promise = this._modalController.create({
            cssClass: ['toggle-horse-to-ride-modal'],
            component: ToggleHorseToRideModalComponent,
            componentProps: {
                horse$: of(horse),
                add$: of(add)
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public quickAddHorse(): Observable<{ horses: HorseForRide[]; newId: string }> {
        const promise = this._modalController.create({
            component: QuickAddHorseModalComponent,
            cssClass: ['quick-add-horse-modal']
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public occupiedHorse(
        horse: HorseForRide,
        ride: Ride
    ): Observable<{ id: string; include: boolean }> {
        const promise = this._modalController.create({
            component: OccupiedHorseModalComponent,
            componentProps: {
                horse$: of(horse),
                ride$: of(ride)
            },
            cssClass: ['generic-ion-modal', 'occupied-horse-modal']
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public deleteHorse(horseId: string): Observable<{ deleted: boolean }> {
        const promise = this._modalController.create({
            component: DeleteHorseModalComponent,
            componentProps: {
                horseId
            },
            cssClass: ['generic-ion-modal']
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public deleteIncompleteRide(rideId: string): Observable<{ deleted: boolean }> {
        const promise = this._modalController.create({
            component: DeleteIncompleteRideModalComponent,
            componentProps: {
                rideId
            },
            cssClass: ['generic-ion-modal']
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public disableEnableHorse(
        horseId: string,
        profileStatus: HorseProfileStatus
    ): Observable<{ confirm: boolean; profileStatus?: HorseProfileStatus }> {
        const promise = this._modalController.create({
            component: DisableHorseModalComponent,
            componentProps: {
                horseId,
                profileStatus
            },
            cssClass: ['generic-ion-modal']
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public sendFriendRequest(user: UserProfile): Observable<{ requestSent: boolean }> {
        const promise = this._modalController.create({
            component: AddFriendModalComponent,
            backdropDismiss: false,
            componentProps: {
                user
            },
            cssClass: ['generic-ion-modal']
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public alreadyFriend(friend: Friend): Observable<{ cancelRequest: boolean }> {
        const promise = this._modalController.create({
            component: AlreadyFriendModalComponent,
            backdropDismiss: false,
            componentProps: {
                friend
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public horseProfileImage(horseId: string): Observable<boolean> {
        const promise = this._modalController.create({
            cssClass: ['horse-profile-modal'],
            component: HorseProfileImageModalComponent,
            componentProps: {
                horseId
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public async horseCompetitionImage(attachedImage: BaseMediaDocument) {
        const modal = await this._modalController.create({
            cssClass: 'horse-competition-modal',
            component: HorseCompetitionImageModalComponent,
            componentProps: {
                attachedImage
            }
        });
        await modal.present();
    }

    public mediaPreview(
        title: string,
        attachmentUrl: string | SafeResourceUrl,
        isVideo: boolean,
        jwPlayerId: string,
        action: string
    ): Observable<{ confirm: boolean }> {
        const promise = this._modalController.create({
            component: MediaPreviewModalComponent,
            componentProps: {
                title,
                attachmentUrl,
                isVideo,
                jwPlayerId,
                action
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss<{ confirm: boolean }>())),
            map(detail => detail.data)
        );
    }

    public addEditHorseHealthModal(
        horseHealth: HorseHealthSimple,
        horseId: string,
        horseHealthType: HorseHealthType
    ): Observable<{ saved: boolean; deleted: boolean }> {
        const promise = this._modalController.create({
            cssClass: ['generic-ion-modal', 'horse-health-modal'],
            component: HorseHealthModalComponent,
            componentProps: {
                horseHealth,
                horseId,
                horseHealthType
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public addEditHorseMatrixModal(
        horseMatrix: HorseMatrixSimple,
        evaluationType: HorseEvaluationType,
        isPastEditEvaluationDeadline$: boolean
    ): Observable<{
        saved: boolean;
        horseId?: string;
        title?: string;
        notes: string;
        rating: number;
        documents: File[];
        index: number | undefined;
        existingDocuments: Media[];
        horseMatrixType: HorseMatrixType;
    }> {
        const promise = this._modalController.create({
            cssClass: ['generic-ion-modal', 'horse-matrix-modal'],
            component: HorseMatrixModalComponent,
            componentProps: {
                horseMatrix,
                evaluationType,
                isPastEditEvaluationDeadline$
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public unsavedChangesModal(): Observable<boolean> {
        const promise = this._modalController.create({
            cssClass: ['generic-ion-modal', 'unsaved-changes-modal'],
            component: UnsavedChangeModalComponent
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public promptMsgModal(): Observable<string> {
        const promise = this._modalController.create({
            cssClass: 'prompt-msg-modal',
            component: PromptMsgModalComponent
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public endRideShareModal(): Observable<{
        share: boolean;
    }> {
        const promise = this._modalController.create({
            cssClass: ['end-ride-share-modal'],
            component: EndRideShareModalComponent
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public imageViewerModal(
        attachmentUrl: string,
        mediaId: string,
        horseId: string,
        pinRemoveView: boolean = false,
        onlyView: boolean = false
    ): Observable<boolean> {
        const promise = this._modalController.create({
            component: ImageViewer,
            componentProps: {
                attachmentUrl: attachmentUrl,
                mediaId: mediaId,
                horseId: horseId,
                pinRemoveView: pinRemoveView,
                onlyView
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public videoViewerModal(jwPlayerId: string): Observable<boolean> {
        const promise = this._modalController.create({
            cssClass: 'horse-photo-modal',
            component: VideoViewerModalComponent,
            componentProps: {
                jwPlayerId
            }
        });
        return from(promise).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public async profileImageCropperModal(
        imageSource: SafeResourceUrl
    ): Promise<HTMLIonModalElement> {
        const fullOptions = {
            imageSource
        };
        const modal = await this._modalController.create({
            component: ProfileImageCropperComponent,
            componentProps: fullOptions,
            cssClass: ['generic-ion-modal', 'image-crop-modal']
        });
        await modal.present();
        return modal;
    }

    public configureGpsParametersModal(): Observable<boolean> {
        const modal = this._modalController.create({
            cssClass: ['generic-ion-modal', 'configure-gps-parameters'],
            component: ConfigureGpsParametersModalComponent
        });

        return from(modal).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }

    public friendRequestModal(friendRequest: Friend): Observable<{
        status: FriendStatus;
    }> {
        const modal = this._modalController.create({
            component: FriendRequestModalComponent,
            componentProps: {
                friendRequest
            },
            cssClass: ['generic-ion-modal']
        });

        return from(modal).pipe(
            take(1),
            tap(m => m.present()),
            switchMap(m => from(m.onDidDismiss())),
            map(detail => detail.data)
        );
    }
}
