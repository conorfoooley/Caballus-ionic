import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, filter, finalize, map, switchMap, take } from 'rxjs/operators';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, of } from 'rxjs';
import { StripeCardComponent, StripeService } from 'ngx-stripe';
import { CheckoutService } from '../../services/checkout.service';
import { UserService } from '../../services/user.service';
import { User } from '@caballus/ui-common';
import { StripeCardElement } from '@stripe/stripe-js';

@Component({
    selector: 'app-transfer-subscription',
    templateUrl: './update-subscription-payment-method-modal.component.html',
    styleUrls: ['./update-subscription-payment-method-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateSubscriptionPaymentMethodModalComponent implements OnInit {
    public updateCardInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _card: StripeCardElement;

    constructor(
        public dialogRef: MatDialogRef<UpdateSubscriptionPaymentMethodModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            user: User,
            paymentMethodId: string
        },
        private readonly _toastService: ToastService,
        private readonly _checkoutService: CheckoutService,
        private readonly _stripeService: StripeService,
        private readonly _userService: UserService
    ) {
    }

    ngOnInit(): void {
        this._checkoutService.elements$.pipe(take(1)).subscribe(elements => {
            if (!this._card) {
                this._card = elements.create('card', {
                    style: {
                        base: {
                            iconColor: '#666EE8',
                            color: '#31325F',
                            lineHeight: '40px',
                            fontWeight: 300,
                            fontFamily: 'sans-serif',
                            fontSize: '18px',
                            '::placeholder': {
                                color: '#CFD7E0'
                            }
                        }
                    }
                });
                this._card.mount('#stripe-card');
            }
        });
    }

    public cancel(): void {
        this.dialogRef.close(false);
        this._toastService.info('No changes made');
    }

    public updatePaymentMethod(): void {
        this.updateCardInProcess$.next(true);
        this._stripeService
            .createPaymentMethod({ type: 'card', card: this._card, billing_details: {} })
            .pipe(
                map(res => {
                    if (!!res.error) {
                        this._toastService.error(res.error.message);
                        return null;
                    }
                    return res;
                }),
                filter(res => !!res),
                switchMap(res =>
                    this._userService
                        .updateSubscriptionPaymentMethod(
                            this.data.user.billing.customerId,
                            this.data.user.billing.subscription.id,
                            this.data.paymentMethodId,
                            res.paymentMethod.id
                        )
                        .pipe(
                            map(() => {
                                this._toastService.info('Payment method changed!');
                                this.dialogRef.close(true);
                                return res;
                            }),
                            catchError(err => {
                                this._toastService.error(err.error.message);
                                return of(err);
                            }),
                            finalize(() => this.updateCardInProcess$.next(false))
                        )
                )
            )
            .subscribe();
    }
}
