import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  FriendService,
  ModalService as CommonModalService,
  UserProfile,
  UserService,
  Notification,
  NotificationService
} from "@caballus/ui-common";
import { ToastService } from "@rfx/ngx-toast";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, switchMap, take } from "rxjs/operators";
import { ModalService } from "@ion-caballus/core/services";
import { FriendStatus } from "@caballus/common";

@Component({
  selector: "app-notifications",
  templateUrl: "./notification.component.html",
  styleUrls: ["./notification.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPageComponent implements OnInit {
  public user$: BehaviorSubject<UserProfile> = new BehaviorSubject(null);
  public userId: string;
  public placeholder: string;
  public notifications$: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>(
    null
  );

  constructor(
    private readonly _userService: UserService,
    private readonly _toastService: ToastService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _friendService: FriendService,
    private readonly _modalService: ModalService,
    private readonly _notificationService: NotificationService,
    private readonly _commonModalService: CommonModalService
  ) {
  }

  ngOnInit(): void {
    this._activatedRoute.paramMap.subscribe(params => {
      this.userId = params.get("id");
    });

    this._activatedRoute.queryParamMap
      .pipe(
        switchMap(params => {
          if (params.get("friendRequestId")) {
            return this._friendService
              .getFriendById(params.get("friendRequestId"))
              .pipe(
                switchMap(friendRequest =>
                  this._modalService
                    .friendRequestModal(
                      friendRequest
                    )
                    .pipe(map(result => result))
                ),
                switchMap(({ status }) => {
                  if (status === FriendStatus.Rejected) {
                    // if friend request is rejected then show block user confirmation
                    return this._blockUserConfirmation();
                  }
                  return of(null);
                }),
                catchError(err => {
                  console.log(err);
                  this._toastService.error(err);
                  return of(err);
                })
              );
          }
          return of(null);
        })
      )
      .subscribe();

    if (!this.userId) {
      this._userService
        .getLoggedInUser()
        .pipe(
          take(1),
          catchError(err => {
            this._toastService.error(err);
            return of(null);
          })
        )
        .subscribe(res => {
          this.user$.next(res.profile);
        });
    } else if (!!this.userId) {
      this._userService
        .getProfile(this.userId)
        .pipe(
          take(1),
          catchError(err => {
            this._toastService.error(err);
            return of(null);
          })
        )
        .subscribe(res => {
          this.user$.next(res);
        });
    }

    /*  this._notificationService.getAllNotifications().subscribe(res => {
         this.notifications$.next(res);
         console.log(res)
     }); */
  }

  /**
   * block user confirmation
   * @private
   */
  private _blockUserConfirmation(): Observable<void> {
    return this._commonModalService
      .openActionDialog(
        "Invitation Declined",
        "Friend Invite Declined.  Requester has been notified. Would you like to block this person from sending future invites?",
        "No",
        "Yes"
      )
      .afterClosed()
      .pipe(switchMap(button => (button && button === "Button2" ? null : of(undefined))));
  }
}
