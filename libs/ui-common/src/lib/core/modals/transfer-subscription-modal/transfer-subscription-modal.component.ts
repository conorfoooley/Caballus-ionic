import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { User } from '../../models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, take, tap } from 'rxjs/operators';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, of } from 'rxjs';
import { InvitationService } from '../../services/invitation.service';

@Component({
    selector: 'app-transfer-subscription',
    templateUrl: './transfer-subscription-modal.component.html',
    styleUrls: ['./transfer-subscription-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferSubscriptionModalComponent implements OnInit {
    public sendRequestInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        public dialogRef: MatDialogRef<TransferSubscriptionModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { user: User },
        private readonly _invitationService: InvitationService,
        private readonly _toastService: ToastService
    ) {
    }

    ngOnInit(): void {
    }

    public goBack(): void {
        this.dialogRef.close();
        this._toastService.info('Request Canceled');
    }

    public sendRequest(): void {
        const newUser = {
            _id: this.data.user._id,
            firstName: this.data.user.profile.firstName,
            lastName: this.data.user.profile.lastName,
            email: this.data.user.profile.email
        };
        this.sendRequestInProcess$.next(true);
        this._invitationService
            .subscriptionTransfer(newUser)
            .pipe(
                take(1),
                tap(() => this.dialogRef.close()),
                tap(() =>
                    this._toastService.success(
                        `Request initiated. Email notification sent to ${this.data.user.profile.firstName} ${this.data.user.profile.lastName}`
                    )
                ),
                catchError(err => {
                    console.error(err);
                    this._toastService.error(err);
                    return of(null);
                }),
                finalize(() => this.sendRequestInProcess$.next(false))
            )
            .subscribe();
    }
}
