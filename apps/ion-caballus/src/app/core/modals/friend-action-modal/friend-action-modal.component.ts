import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Friend, FriendService } from '@caballus/ui-common';
import { ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { catchError } from 'rxjs/operators';
import { FriendStatus } from '@caballus/common';

@Component({
    selector: 'app-friend-action-modal',
    templateUrl: './friend-action-modal.component.html',
    styleUrls: ['./friend-action-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendActionModalComponent implements OnInit {
    @Input()
    public friendRequest!: Friend;

    constructor(
        private readonly _modalController: ModalController,
        private readonly _toastService: ToastService,
        private readonly _friendService: FriendService
    ) {}

    ngOnInit(): void {}

    public blockFriend(): void {
        this._friendService
            .blockFriend(this.friendRequest._id)
            .pipe(
                catchError(e => {
                    this._toastService.error('Block friend request failed! Please try again');
                    return e;
                })
            )
            .subscribe(res => {
                this._toastService.success('Blocked Friend');
                // do something here
                this._modalController.dismiss({ status: FriendStatus.Friends });
            });
    }

    public unblockFriend(): void {
        this._friendService
            .unblockFriend(this.friendRequest._id)
            .pipe(
                catchError(e => {
                    this._toastService.error('Unblock friend failed! Please try again');
                    console.log(e);
                    return e;
                })
            )
            .subscribe(res => {
                this._toastService.success('Unblocked Friend');
                // do something here
                this._modalController.dismiss({ status: FriendStatus.Friends });
            });
    }

    public cancel(): void {
        // do something here
        this._modalController.dismiss({ status: FriendStatus.Friends });
    }

    public isBlocked(friendStatus: FriendStatus) {
        return friendStatus == FriendStatus.Blocked;
    }
}
