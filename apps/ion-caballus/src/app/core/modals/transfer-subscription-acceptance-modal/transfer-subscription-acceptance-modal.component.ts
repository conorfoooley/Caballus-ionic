import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ToastService, User, UserService } from '@caballus/ui-common';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

@Component({
    selector: 'app-transfer-subscription-acceptance-modal',
    templateUrl: './transfer-subscription-acceptance-modal.component.html',
    styleUrls: ['./transfer-subscription-acceptance-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferSubscriptionAcceptanceModalComponent implements OnInit {
    public user$: Observable<User>;

    constructor(
        private readonly _userService: UserService,
        private readonly _toastService: ToastService
    ) {}

    ngOnInit(): void {
        this.user$
            .pipe(
                take(1),
                switchMap(user => this._userService.getLoggedInUser()),
                catchError(err => {
                    this._toastService.error(err);
                    return of(null);
                })
            )
            .subscribe();
    }
}
