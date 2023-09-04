import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from "@angular/core";
import {
  FriendService,
  Notification,
  NotificationCategory,
  NotificationService,
  NotificationType,
  ReadStatus,
  timeSince,
  User
} from "@caballus/ui-common";
import { FriendStatus, NotificationSummary } from "@caballus/common";
import { AppState, UserState } from "@ion-caballus/core/state";
import {
  ActionSheetController,
  AlertController,
  ModalController
} from "@ionic/angular";
import { Emittable, Emitter } from "@ngxs-labs/emitter";
import {
  DateRangeFilter,
  PaginatedList,
  Pagination,
  SortDirection
} from "@rfx/common";
import { ToastService } from "@rfx/ngx-toast";
import { ModalService } from "@ion-caballus/core/services";
import { BehaviorSubject, from, Observable, of, Subject } from "rxjs";
import {
  catchError,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { FetchNavigationAction } from "@ion-caballus/core/state/actions";

export interface NotificationsLoadCustomEvent extends CustomEvent {
  target: HTMLIonInfiniteScrollElement | HTMLIonRefresherElement;
}

@Component({
  selector: "app-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Emitter(AppState.refreshNotifications)
  public refreshNotifications: Emittable<boolean>;

  @Emitter(UserState.setNotificationSummary)
  public setNotificationSummary: Emittable<NotificationSummary>;

  @Select(UserState.user)
  public user$!: Observable<User>;

  public userId!: string;
  private _onDestroy$: Subject<void> = new Subject<void>();
  private readonly _loadNotificationsFeed$: Subject<void> = new Subject<void>();
  private readonly _markAsRead$: Subject<string> = new Subject<string>();
  private readonly _markAllAsRead$: Subject<void> = new Subject<void>();

  private _loadEvent: NotificationsLoadCustomEvent;
  private _loadDate: Date;
  private _page: number = 1;

  public timeSince: (eventDate: Date, toDate?: Date) => string = timeSince;
  public readStatus: typeof ReadStatus = ReadStatus;
  public notifications$: BehaviorSubject<Notification[]> = new BehaviorSubject<
    Notification[]
  >([]);
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );
  public hasMoreFeed$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );
  public noNotifications$: Observable<boolean> = this.notifications$.pipe(
    takeUntil(this._onDestroy$),
    map((n) => n.length === 0)
  );

  constructor(
    private readonly _alertCtrl: AlertController,
    private readonly _modalCtrl: ModalController,
    private readonly _toastService: ToastService,
    private readonly _actionSheetCtrl: ActionSheetController,
    private readonly _modalService: ModalService,
    private readonly _notificationsService: NotificationService,
    private readonly _friendService: FriendService,
    private readonly _store: Store
  ) {
  }

  public parseNotificationUrl(notification: Notification): string {
    if (!notification) {
      return null;
    }
    try {
      switch (notification.notificationType) {
        case NotificationType.NewConnectionRequest:
          return `/tabs/click/request/${notification.connectedUserIdentity._id}`;
        case NotificationType.NewConnectionAccepted:
        case NotificationType.NewConnectionMade:
          return "/tabs/connections";
        case NotificationType.WallPostTagged:
        case NotificationType.WallPostComment:
        case NotificationType.WallPostLiked:
          return `/tabs/wall/post/${notification.connectedRootPostId || notification.connectedPostId
            }/reaction/${notification.connectedPostId}`;
        case NotificationType.FriendAccept:
        case NotificationType.FriendReject:
        case NotificationType.FriendInvite:
          return `/tabs/menu/profile/${notification?.riderIdentity?._id || notification?.friendIdentity?._id}`;
        case NotificationType.RideEnded:
          return `/tabs/horse-profile/detail-horse/view-ride-detail/${notification.horseIdentity._id}/${notification.rideId}`;
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  public ngOnInit(): void {
    this._loadNotificationsFeed$
      .pipe(
        takeUntil(this._onDestroy$),
        tap(() => this.loading$.next(true)),
        switchMap(() =>
          this._notificationsService.getNotificationFeed({
            filters: {
              createdDate: new DateRangeFilter({
                endDate: this._loadDate
              })
            },
            sort: {
              field: "createdDate",
              sortOrder: SortDirection.Descending
            },
            pagination: new Pagination({
              page: this._page
            })
          })
        ),
        map(
          (res) =>
            new PaginatedList<Notification>({
              count: res.count,
              docs: res.docs.map((d) => new Notification(d))
            })
        ),
        switchMap((loadedFeed) =>
          from(
            this._loadEvent
              ? this._loadEvent.target.complete()
              : Promise.resolve()
          ).pipe(
            tap(() => (this._loadEvent = undefined)),
            map(() => loadedFeed)
          )
        ),
        withLatestFrom(this.notifications$),
        map(([loadedFeed, currentFeed]) => {
          if (this._page === 1 && loadedFeed.count === loadedFeed.docs.length) {
            this.hasMoreFeed$.next(false);
          } else if (
            currentFeed.length + loadedFeed.docs.length ===
            loadedFeed.count
          ) {
            this.hasMoreFeed$.next(false);
          } else {
            this.hasMoreFeed$.next(loadedFeed.docs.length > 0);
          }
          if (this._page === 1) {
            return loadedFeed.docs;
          } else {
            return [...currentFeed, ...loadedFeed.docs];
          }
        }),
        tap((posts) => this.notifications$.next(posts)),
        tap(() => this.loading$.next(false)),
        tap(() => this._page++),
        catchError((err) => {
          this._toastService.error(
            err instanceof HttpErrorResponse
              ? err.error.message
              : "Request error"
          );
          this.loading$.next(false);
          return of(undefined);
        })
      )
      .subscribe();

    this._markAsRead$
      .pipe(
        takeUntil(this._onDestroy$),
        switchMap((notificationId) =>
          this._notificationsService.markNotificationAsRead(notificationId)
        ),
        tap(() => this.reload()),
        tap(() => this.refreshNotifications.emit(true)),
        catchError((err) => {
          this._toastService.error(
            err instanceof HttpErrorResponse
              ? err.error.message
              : "Request error"
          );
          this.loading$.next(false);
          return of(undefined);
        })
      )
      .subscribe();

    this._markAllAsRead$
      .pipe(
        takeUntil(this._onDestroy$),
        switchMap(() =>
          this._notificationsService.markUserNotificationsAsRead()
        ),
        tap(() => this.reload()),
        tap(() => this.refreshNotifications.emit(true)),
        catchError((err) => {
          this._toastService.error(
            err instanceof HttpErrorResponse
              ? err.error.message
              : "Request error"
          );
          this.loading$.next(false);
          return of(undefined);
        })
      )
      .subscribe();

    this._store.dispatch(FetchNavigationAction);
    // Fetch user id from user state
    this.user$.pipe(take(1)).subscribe((user) => (this.userId = user._id));
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  public ionViewDidEnter(): void {
    this._loadDate = new Date();
    this._page = 1;
    this._loadNotificationsFeed$.next();
  }

  public reload(event?): void {
    this._loadEvent = event || undefined;
    this._loadDate = new Date();
    this._page = 1;
    this._loadNotificationsFeed$.next();
    this._notificationsService
      .getNotificationSummary()
      .pipe(
        catchError((err) => {
          console.error("Error getting notifications", err);
          return of(null);
        }),
        switchMap((summary) => this.setNotificationSummary.emit(summary))
      )
      .subscribe();
  }

  public loadMore(event?): void {
    this._loadEvent = event || undefined;
    this._loadNotificationsFeed$.next();
  }

  public markAllAsRead(): void {
    this._markAllAsRead$.next();
  }

  public async markAsRead(notification: Notification): Promise<void> {
    let vis = true;
    if (notification.notificationCategory === NotificationCategory.Rider) {
      if (notification.notificationType === NotificationType.FriendInvite) {
        this._friendService.getFriendById(notification.friendId).subscribe(
          (friendRequest) => {
            if (friendRequest.friendStatus === FriendStatus.Requested) {
              vis = false;
              this._modalService
                .friendRequestModal(
                  friendRequest
                )
                .pipe(
                  take(1),
                  tap((result) => {
                    this._markAsRead$.next(notification._id);
                  })
                )
                .subscribe((r) => {
                  console.log(r);
                  // this.reload();
                });
            }
          },
          (error) => {
            this._modalService
              .notificationView(notification)
              .pipe(
                take(1),
                tap((data) => {
                  data?.markAsRead ? this._markAsRead$.next(notification._id) : "";
                })
              )
              .subscribe((r) => {
                // this.reload();
              });
          }
        );
      } else {
        this._markAsRead$.next(notification._id);
      }
    } else {
      this._markAsRead$.next(notification._id);
    }
  }

  public parseProfilePictureUrl(notification: Notification): string {
    if (notification.notificationCategory === NotificationCategory.Rider) {
      if (
        notification.riderIdentity &&
        notification.riderIdentity.profilePicture &&
        notification.riderIdentity.profilePicture.url
      ) {
        return notification.riderIdentity.profilePicture.url;
      } else {
        return "/assets/icons/user-placeholder.svg";
      }
    }
    if (notification.notificationCategory === NotificationCategory.Horse) {
      if (
        notification.horseIdentity &&
        notification.horseIdentity.picture &&
        notification.horseIdentity.picture.url
      ) {
        return notification.horseIdentity.picture.url;
      } else {
        return "/assets/icons/horse.svg";
      }
    }
    if (notification.notificationCategory === NotificationCategory.Caballus) {
      return "/assets/icons/logo.svg";
    }

    return "/assets/icons/logo.svg";
  }

  public isInviteLink(notification: Notification): boolean {
    return notification.notificationType === NotificationType.FriendInvite;
  }

  public isRequested(notificationType: NotificationType) {
    return notificationType == NotificationType.FriendInvite;
  }
}
