import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    CheckoutService,
    InvitationService,
    ModalService,
    User,
    UserService
} from '@caballus/ui-common';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { StripeService } from 'ngx-stripe';
import { catchError, filter, finalize, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ToastService } from '@rfx/ngx-toast';
import { FetchUserAction, UserState } from '@caballus/ui-state';
import { StripeCardElement } from '@stripe/stripe-js';

@Component({
    selector: 'caballus-app-payment',
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentComponent implements OnInit, OnDestroy {
    @Select(UserState.user)
    public user$: Observable<User>;

    public paymentForm: FormGroup = this._formBuilder.group({
        couponCode: ['']
    });
    public paymentInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    private _invitationId: string;
    private _onDestroy$: Subject<void> = new Subject();
    private _card: StripeCardElement;

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _stripeService: StripeService,
        private readonly _checkoutService: CheckoutService,
        private readonly _userService: UserService,
        private readonly _toastService: ToastService,
        private readonly _commonModalService: ModalService,
        private readonly _invitationService: InvitationService,
        private readonly _store: Store,
        private readonly _router: Router
    ) {}

    ngOnInit(): void {
        this._activatedRoute.queryParamMap.pipe(take(1)).subscribe(params => {
            this._invitationId = params.get('invitationId');
        });

        this._checkoutService.elements$.pipe(takeUntil(this._onDestroy$)).subscribe(elements => {
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

    public goBack(): void {
        this._router.navigate(['my-account']);
    }

    public savePaymentDetails(): void {
        this._commonModalService
            .openActionDialog('Payment Confirmation!', 'Are you sure!', 'Cancel', 'Confirm')
            .afterClosed()
            .pipe(
                filter(button => button === 'Button2'),
                tap(() => this.paymentInProcess$.next(true)),
                switchMap(() =>
                    this._stripeService
                        .createPaymentMethod({type: 'card', card: this._card})
                        .pipe(
                            map(res => {
                                if (res.error) {
                                    this._toastService.error(res.error.message);
                                    return null;
                                }
                                return res;
                            })
                        )
                ),
                filter(res => !!res),
                switchMap(res =>
                    this._userService
                        .subscription(
                            res.paymentMethod['id'],
                            null,
                            this.paymentForm.get('couponCode').value
                        )
                        .pipe(
                            catchError(err => {
                                this._toastService.error(
                                    err && err.error ? err.error.message : err
                                );
                                return throwError(err);
                            })
                        )
                ),
                catchError(err => {
                    this._toastService.error(err && err.error ? err.error.message : err);
                    return throwError(err);
                }),
                finalize(() => this.paymentInProcess$.next(false))
            )
            .subscribe(
                res => {
                    if (this._invitationId) {
                        // send payment responsibility accepted email
                        this._invitationService
                            .acceptSubscriptionTransfer(this._invitationId)
                            .subscribe();
                    }

                    // show payment success message
                    this._toastService.success('Payment Successful');
                    // refresh user details
                    this._store.dispatch(new FetchUserAction());
                    // navigate to the my-account screen
                    this._router.navigate(['my-account']);
                }
            );
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }
}
