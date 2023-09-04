import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Friend, FriendService } from '@caballus/ui-common';
import { ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

@Component({
    selector: 'app-already-friend-modal',
    templateUrl: './already-friend-modal.component.html',
    styleUrls: ['./already-friend-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlreadyFriendModalComponent implements OnInit {
    @Input()
    public friend: Friend;
    public isCancelFriendRequestInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _modalController: ModalController,
        private readonly _toastService: ToastService,
        private readonly _friendService: FriendService
    ) {
    }

    ngOnInit(): void {
    }

    public goBack(cancelRequest: boolean): void {
        this._modalController.dismiss({cancelRequest});
    }

    public cancelRequest(): void {
        this.isCancelFriendRequestInProcess$.next(true);
        this._friendService
            .removeFriend(this.friend._id)
            .pipe(
                map(() => {
                    this.isCancelFriendRequestInProcess$.next(false);
                    this._toastService.success('Request Canceled');
                    this.goBack(true);
                }),
                catchError(err => {
                    console.error(err);
                    this.isCancelFriendRequestInProcess$.next(false);
                    this._toastService.error(err);
                    return of(null);
                })
            )
            .subscribe();
    }
}
