import { Location } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
  HorseDetails,
  HorseProfileStatus,
  HorseService,
  Invitation,
  InvitationService,
  ModalService,
  SubscriptionResponsibility,
  User,
  UserService
} from "@caballus/ui-common";
import { BehaviorSubject, Observable, of, Subject, throwError } from "rxjs";
import { ToastService } from "@rfx/ngx-toast";
import {
  catchError,
  filter,
  finalize,
  map,
  switchMap,
  switchMapTo,
  take,
  tap
} from "rxjs/operators";
import { paramsStream } from "../shared";
import { FetchUserAction, UserState } from "@caballus/ui-state";
import { Select, Store } from "@ngxs/store";
import { Router } from "@angular/router";
import Stripe from "stripe";

@Component({
  selector: "app-subscription",
  templateUrl: "./subscription.component.html",
  styleUrls: ["./subscription.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  @Select(UserState.user)
  public user$: Observable<User>;

  public form: FormGroup = this._formBuilder.group({
    email: ["", [Validators.required, Validators.email]]
  });
  public isLoadingData$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public horses$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
  public enabledHorsesCount$: BehaviorSubject<number> = new BehaviorSubject(0);
  public sendTransferRequestInProcess$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public userSubscriptionsList$: BehaviorSubject<SubscriptionResponsibility[]> =
    new BehaviorSubject(null);
  public userSubscriptionPaymentMethod$: BehaviorSubject<Stripe.PaymentMethod> =
    new BehaviorSubject(null);
  public isRemoveSubscriptionInProcess$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  private _onDestroy$: Subject<void> = new Subject();
  private _invitationDetails: Invitation = null;
  private _isSubscriptionAlreadyExists: boolean = false;
  private _user: User;

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _horseService: HorseService,
    private readonly _userService: UserService,
    private readonly _toastService: ToastService,
    private readonly _modalService: ModalService,
    private readonly _location: Location,
    private readonly _store: Store,
    private readonly _invitationService: InvitationService,
    private readonly _router: Router
  ) {
  }

  ngOnInit(): void {
    paramsStream
      .asObservable()
      .pipe(
        tap(() => this.isLoadingData$.next(true)),
        take(1),
        filter((param) => !!param && !!param.token),
        switchMap(() => this._store.dispatch(new FetchUserAction())),
        switchMapTo(this._store.select((s) => s.user.user).pipe(take(1))),
        tap((user) => {
          this._user = user;
        }),
        switchMap(() => this._horseService.getViewableHorses()),
        tap((horses) => {
          this.horses$.next(horses);
          const count = horses.reduce((acc, horse: HorseDetails) => {
            return horse.profile.profileStatus === HorseProfileStatus.Active
              ? acc + 1
              : acc;
          }, 0);
          this.enabledHorsesCount$.next(count);

          // fetch user's other subscriptions
          this._fetchUserSubscriptionList();

          if (!!this._user.billing && !!this._user.billing.customerId) {
            this._fetchUserSubscriptionPaymentMethodList(
              this._user.billing.customerId
            );
          }

          const subscriptionInvitationId =
            !!paramsStream.getValue().subscriptionInvitationId;
          // verify if the subscriptionInvitationId is present
          if (subscriptionInvitationId) {
            // show payment responsibility modal
            this.showPaymentResponsibilityModal(
              paramsStream.getValue().subscriptionInvitationId
            );
          }
        }),
        finalize(() => {
          this.isLoadingData$.next(false);
        })
      )
      .subscribe();

    this.user$.pipe().subscribe((user) => {
      if (!!user && !!user.billing && user.billing.customerId) {
        this._fetchUserSubscriptionPaymentMethodList(user.billing.customerId);
        this._user = user;
      }
    });
  }

  public ionViewDidEnter(): void {
    const paramObject = paramsStream.getValue();
    if (paramObject && paramObject.token) {
      this._horseService
        .getViewableHorses()
        .pipe(
          map((horses) => {
            this.horses$.next(horses);
            const count = horses.reduce((acc, horse: HorseDetails) => {
              return horse.profile.profileStatus === HorseProfileStatus.Active
                ? acc + 1
                : acc;
            }, 0);
            this.enabledHorsesCount$.next(count);
          })
        )
        .subscribe();
    }
  }

  public goBack(): void {
    const deepLinkUrl = !!paramsStream.getValue()
      ? paramsStream.getValue().deepLink
      : null;
    !!deepLinkUrl ? (location.href = deepLinkUrl) : this._location.back();
  }

  public sendRequest(): void {
    // verify form validity
    if (this.form.invalid) {
      this._toastService.error("Please enter a valid email");
      return;
    }

    // get user entered email
    const email = this.form.controls.email.value;

    // verify if user has entered his/her email
    if (this._user.profile.email === email) {
      this._toastService.error("Please enter another user email");
      return;
    }

    this.sendTransferRequestInProcess$.next(true);
    // get user details by email
    this._userService
      .getUserByEmail(email)
      .pipe(
        take(1),
        switchMap(async (res) => {
          if (!res) {
            // show error message when user not found
            this._toastService.error("A user with that email is not found");
            return of(null);
          }
          // open transfer subscription modal
          return this._modalService.transferSubscription(res);
        }),
        finalize(() => this.sendTransferRequestInProcess$.next(false))
      )
      .subscribe();
  }

  /**
   * showPaymentResponsibilityModal
   * it presents the payment responsibility modal,where a user can accept or decline the payment request
   * @param invitationId
   */
  public showPaymentResponsibilityModal(invitationId: string): void {
    // get subscription transfer details
    this._invitationService
      .subscriptionTransferDetails(invitationId)
      .pipe(
        switchMap((invitation) => {
          this._invitationDetails = invitation;

          // prepare description
          let description = `${invitation.from.label} has asked if you will pay for their caballus account.`;
          // verify if the subscription already exists
          this._isSubscriptionAlreadyExists =
            !!this._user.billing &&
            !!this._user.billing.customerId &&
            !!this._user.billing.subscription &&
            this._user.billing.subscription.status === "active";
          if (this._isSubscriptionAlreadyExists) {
            description =
              description +
              "If you accept this request then you will be billed using the same payment method you are currently using.";
          }

          // open payment responsibility modal
          return this._modalService
            .openActionDialog(
              "Payment Responsibility Acceptance",
              description,
              "Decline",
              "Accept"
            )
            .afterClosed();
        }),
        switchMap((res) => {
          if (res) {
            if (res === "Button1") {
              // decline the transfer request
              return this._invitationService
                .declineSubscriptionTransfer(invitationId)
                .pipe(
                  tap(() => {
                    // show payment declined message
                    this._toastService.success(
                      "Payment Responsibility Declined.Requester has been notified"
                    );
                  })
                );
            } else {
              // payment responsibility accepted
              // verify if the user already have subscribed for the payment
              if (this._isSubscriptionAlreadyExists) {
                // get paymentMethod
                return this.userSubscriptionPaymentMethod$.pipe(
                  take(1),
                  switchMap((paymentMethod) =>
                    this._userService
                      .subscription(
                        paymentMethod.id,
                        this._invitationDetails.from._id
                      )
                      .pipe(
                        switchMap(() =>
                          // send payment responsibility accepted email
                          this._invitationService.acceptSubscriptionTransfer(
                            invitationId
                          )
                        ),
                        tap(() => {
                          // show payment success message
                          this._toastService.success("Payment Successful");
                          // refresh user details
                          this._store.dispatch(new FetchUserAction());
                          // refresh subscription list
                          this._fetchUserSubscriptionList();
                        }),
                        catchError((err) => {
                          // show error message
                          this._toastService.error(
                            err.error ? err.error.message : err
                          );
                          return throwError(err);
                        })
                      )
                  ),
                  catchError((err) => {
                    // show error message
                    this._toastService.error("Payment method not found!");
                    return throwError(err);
                  })
                );
              } else {
                // if not navigate user to the next screen
                return of(
                  this._router.navigate(["my-account", "payment"], {
                    queryParams: { invitationId }
                  })
                );
              }
            }
          }
          return of(undefined);
        }),
        catchError((err) => {
          // show error message
          this._toastService.error(err.error ? err.error.message : err);
          return of(err);
        })
      )
      .subscribe();
  }

  /**
   * removeSubscription
   * @param userSubscription
   */
  public removeSubscription(
    userSubscription: SubscriptionResponsibility
  ): void {
    // show remove subscription confirmation dialog
    this._modalService
      .confirm(
        "Remove Payment Arrangement",
        `You are about to remove the payment arrangement for ${userSubscription.label}.
            This will automatically disable all except one of their horses.  Do you with to continue.`,
        "Remove Arrangement"
      )
      .afterClosed()
      .pipe(
        // continue if confirmed
        filter((confirmed) => !!confirmed),
        // show loader
        tap(() => this.isRemoveSubscriptionInProcess$.next(true)),
        switchMap(() =>
          // call remove subscription api
          this._userService
            .removeSubscription(
              userSubscription.subscriptionId,
              userSubscription._id
            )
            .pipe(
              tap(() => {
                // show payment arrangement removed success message
                this._toastService.success(
                  "Payment arrangement removed successfully"
                );
                // refresh subscription list
                this._fetchUserSubscriptionList();
              }),
              catchError((err) => {
                // show error message
                this._toastService.error(err.error ? err.error.message : err);
                return of(err);
              }),
              finalize(() => {
                // hide loader
                this.isRemoveSubscriptionInProcess$.next(false);
              })
            )
        )
      )
      .subscribe();
  }

  /**
   * downgradeConfirmation
   * It will ask for the confirmation of before downgrading
   */
  public downgradeConfirmation(): void {
    this._modalService
      .openActionDialog(
        "Downgrading Subscription",
        "You have selected the option to downgrade your subscription to the free version which allows you to enable only 1 horse.",
        "Downgrade",
        "Cancel"
      )
      .afterClosed()
      .pipe(
        switchMap((button) =>
          button && button === "Button1" ? this._downGrade() : of(undefined)
        )
      )
      .subscribe();
  }

  /**
   * updatePaymentMethod
   * It will present the update payment method modal
   */
  public updatePaymentMethod(): void {
    // get paymentMethod
    let paymentMethod: Stripe.PaymentMethod;
    this.userSubscriptionPaymentMethod$
      .pipe(take(1))
      .subscribe((res) => (paymentMethod = res));

    // show update subscription payment method modal
    this._modalService
      .updateSubscriptionPaymentMethod(this._user, paymentMethod.id)
      .afterClosed()
      .pipe(
        filter((isUpdated) => !!isUpdated),
        tap(() => {
          // re fetch user subscription payment method list
          this._fetchUserSubscriptionPaymentMethodList(
            this._user.billing.customerId
          );
        })
      )
      .subscribe();
  }

  /**
   * _fetchUserSubscriptionList
   * it fetches user's subscription list
   * @private
   */
  private _fetchUserSubscriptionList(): void {
    // fetch subscription list
    this._userService
      .subscriptionList()
      .pipe(
        tap((res) => {
          // set userSubscriptionList$ property
          this.userSubscriptionsList$.next(res && res.length ? res : null);
        }),
        catchError((err) => {
          // show error message
          this._toastService.error(err.error ? err.error.message : err);
          // set userSubscriptionList$ property
          this.userSubscriptionsList$.next(null);
          return of(err);
        })
      )
      .subscribe();
  }

  /**
   * _fetchUserSubscriptionPaymentMethodList
   * it fetches user subscription payment method list
   * @private
   */
  private _fetchUserSubscriptionPaymentMethodList(customerId: string): void {
    // fetch subscription payment method list
    this._userService
      .subscriptionPaymentMethodList(customerId)
      .pipe(
        tap((res) => {
          // set userSubscriptionList$ property
          this.userSubscriptionPaymentMethod$.next(
            res && res.length ? res[0] : null
          );
        }),
        catchError((err) => {
          // show error message
          this._toastService.error(err.error ? err.error.message : err);
          // set userSubscriptionList$ property
          this.userSubscriptionPaymentMethod$.next(null);
          return of(err);
        })
      )
      .subscribe();
  }

  /**
   * _downGrade
   * downgrade the subscription
   * @private
   */
  private _downGrade(): Observable<void> {
    // call remove subscription api
    return this._userService
      .removeSubscription(this._user.billing.subscription.id, this._user._id)
      .pipe(
        tap(() => {
          // refresh user details
          this._store.dispatch(new FetchUserAction());
        }),
        catchError((err) => {
          // show error message
          this._toastService.error(err.error ? err.error.message : err);
          return of(err);
        }),
        finalize(() => {
          // hide loader
          this.isRemoveSubscriptionInProcess$.next(false);
        })
      );
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }
}
