import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Friend, FriendService } from '@caballus/ui-common';
import { ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { catchError, finalize } from 'rxjs/operators';
import { FriendStatus } from '@caballus/common';
import { BehaviorSubject, of, Subject } from 'rxjs';

@Component({
    selector: 'app-friend-request-modal',
    templateUrl: './friend-request-modal.component.html',
    styleUrls: ['./friend-request-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendRequestModalComponent implements OnInit {
    @Input()
    public friendRequest!: Friend;
    public isAcceptFriendRequestInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isDeclineFriendRequestInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _modalController: ModalController,
        private readonly _toastService: ToastService,
        private readonly _friendService: FriendService
    ) {}

    ngOnInit(): void {}

    public acceptRequest(): void {
        this.isAcceptFriendRequestInProcess$.next(true);
        this._friendService
            .acceptFriendRequest(this.friendRequest._id)
            .pipe(
                catchError(e => {
                    this._toastService.error('Accept friend request failed! Please try again');
                    console.log(e);
                    return of(e);
                }),
                finalize(() => {
                    this.isAcceptFriendRequestInProcess$.next(false);
                })
            )
            .subscribe(res => {
                this._toastService.success('Friend request Accepted');
                // do something here
                this._modalController.dismiss({ status: FriendStatus.Friends });
            });
    }

    public rejectRequest(): void {
        this.isDeclineFriendRequestInProcess$.next(true);
        this._friendService
            .rejectFriendRequest(this.friendRequest._id)
            .pipe(
                catchError(e => {
                    this._toastService.error('Decline friend request failed! Please try again');
                    console.log(e);
                    return of(e);
                }),
                finalize(() => {
                    this.isDeclineFriendRequestInProcess$.next(false);
                })
            )
            .subscribe(res => {
                // do something here
                this._modalController.dismiss({ status: FriendStatus.Rejected });
            });
    }

    // on dismiss we just set the status to the current request status, whatever it may be
    public dismiss(): void {
        this._modalController.dismiss({ status: this.friendRequest.friendStatus });
    }
}
