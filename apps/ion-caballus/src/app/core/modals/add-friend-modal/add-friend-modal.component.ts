import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { FriendRequestDto, FriendService, UserProfile } from '@caballus/ui-common';
import { InvitationCache } from '@ion-caballus/core/caches';
import { ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-add-friend-modal',
    templateUrl: './add-friend-modal.component.html',
    styleUrls: ['./add-friend-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFriendModalComponent implements OnInit {
    @Input()
    public user!: UserProfile;

    public isAddFriendInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _modalController: ModalController,
        private readonly _invitationCache: InvitationCache,
        private readonly _toastService: ToastService,
        private readonly _friendService: FriendService
    ) {
    }

    ngOnInit(): void {
    }

    public goBack(): void {
        this._modalController.dismiss({requestSent: false});
        this._toastService.info('Request Canceled');
    }

    public sendRequest(): void {
        this.isAddFriendInProcess$.next(true);
        this._friendService
            .createFriend(this.user._id)
            .pipe(
                switchMap((friendRequestId: string) => {
                    const newUser: FriendRequestDto = {
                        _id: this.user._id,
                        firstName: this.user.firstName,
                        lastName: this.user.lastName,
                        email: this.user.email,
                        friendRequestId
                    };
                    return this._invitationCache.friendRequest(newUser).pipe(
                        tap(() => this.isAddFriendInProcess$.next(false)),
                        tap(() => this._modalController.dismiss({requestSent: true})),
                        tap(() =>
                            this._toastService.success(
                                `Request initiated. Email notification sent to ${this.user.firstName} ${this.user.lastName}`
                            )
                        ),
                        catchError(err => {
                            console.error(err);
                            this.isAddFriendInProcess$.next(false);
                            this._toastService.error(err && err.error ? err.error.message : err);
                            return of(null);
                        })
                    );
                }),
                catchError(err => {
                    console.error(err);
                    this.isAddFriendInProcess$.next(false);
                    this._toastService.error(err && err.error ? err.error.message : err);
                    return of(null);
                })
            )
            .subscribe();
    }
}
