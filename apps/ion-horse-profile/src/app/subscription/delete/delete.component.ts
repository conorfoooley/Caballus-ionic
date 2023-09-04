import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  CheckoutService,
  InvitationService,
  ModalService,
  User,
  UserService
} from "@caballus/ui-common";
import { Select, Store } from "@ngxs/store";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { StripeService } from "ngx-stripe";
import { catchError, filter, finalize, map, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { ToastService } from "@rfx/ngx-toast";
import { FetchUserAction, UserState } from "@caballus/ui-state";
import { environment } from "../../../environments/environment";

@Component({
  selector: "caballus-app-delete",
  templateUrl: "./delete.component.html",
  styleUrls: ["./delete.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteComponent implements OnDestroy {
  @Select(UserState.user)
  public user$: Observable<User>;

  public deleteInProcess$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _onDestroy$: Subject<void> = new Subject();

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _stripeService: StripeService,
    private readonly _checkoutService: CheckoutService,
    private readonly _userService: UserService,
    private readonly _toastService: ToastService,
    private readonly _commonModalService: ModalService,
    private readonly _invitationService: InvitationService,
    private readonly _store: Store,
    private readonly _router: Router
  ) {
  }

  public goBack(): void {
    this._router.navigate(["my-account"]);
  }

  public deleteAccount(): void {
    this._commonModalService
      .openActionDialog(
        "Delete Confirmation!",
        "Warning: This will permanently remove all of your account details and you will not be able to recover. It may take up to an hour for your account to be fully removed.",
        "Cancel",
        "Confirm"
      )
      .afterClosed()
      .pipe(
        filter(button => button === "Button2"),
        tap(() => this.deleteInProcess$.next(true)),
        switchMap(() => this._userService.deleteCurrentUser()),
        catchError(err => {
          this._toastService.error(err && err.error ? err.error.message : err);
          return of(err);
        }),
        finalize(() => {
          this.deleteInProcess$.next(false);
          location.href = environment.ionBaseUrl;
        })
      )
      .subscribe(
        res => {
          // show delete success message
          this._toastService.success("Account Successfully Removed");
          // refresh user details
          this._store.dispatch(new FetchUserAction());
          // log user out
          this._router.navigate(["my-account"]);
        },
        err => {
          // show Payment failed message
          this._toastService.error("There was a problem removing your account.");
          console.log(err);
        }
      );
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }
}
