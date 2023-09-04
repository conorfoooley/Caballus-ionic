import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  MediaUploadItem,
  ModalService,
  NotificationService,
  User,
  UserService,
  ENABLE_VERIFIED_ACCOUNT_GATE
} from '@caballus/ui-common';
import { Select, Store } from '@ngxs/store';
import { Observable, BehaviorSubject, of, interval, Subject } from 'rxjs';
import {
  AuthState,
  MediaUploadQueueState,
  UserState,
} from '@ion-caballus/core/state';
import { NotificationSummary } from '@caballus/common';
import { Emittable, Emitter } from '@ngxs-labs/emitter';
import {
  map,
  catchError,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  ResetShowSubscriptionCancelledPopup,
  SetCurrentUploadingItemAction,
} from '@ion-caballus/state/actions';
import { Router } from '@angular/router';
import { CapacitorPluginService, MediaUploadQueueService } from '@ion-caballus/core/services';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements OnInit {
  public user$: BehaviorSubject<User> = new BehaviorSubject(null);
  @Select(AuthState.authenticated)
  public isUserLoggedIn$: Observable<boolean>;

  @Select(UserState.showSubscriptionCancelledPopup)
  public showSubscriptionCancelledPopup$: BehaviorSubject<boolean>;

  public notificationMessage$?: Observable<string>;

  @Emitter(UserState.setNotificationSummary)
  public setNotificationSummary: Emittable<NotificationSummary>;

  @Emitter(MediaUploadQueueState.rehydrateMediaUploadQueue)
  public rehydrateMediaUploadQueue: Emittable<MediaUploadItem[]>;

  private _onViewWillLeave$: Subject<void> = new Subject();

  constructor(
    private readonly _notificationService: NotificationService,
    private readonly _userService: UserService,
    private readonly _modalService: ModalService,
    private readonly _mediaUploadQueueService: MediaUploadQueueService,
    private readonly _store: Store,
    private readonly _router: Router,
    private readonly _capacitorPluginService: CapacitorPluginService
  ) {}

  ngOnInit(): void {
    this._userService
      .getLoggedInUser()
      .pipe(take(1))
      .subscribe((res) => {
        this.user$.next(res);
      });

    this.notificationMessage$ = this.user$.pipe(
      map((user) => {
        if (user && user.settings && !user.settings.verifiedEmail && ENABLE_VERIFIED_ACCOUNT_GATE) {
          return 'Please validate your account within 72 hours (check your email) to keep your data.';
        } else {
          return null;
        }
      })
    );

    this._notificationService
      .getNotificationSummary()
      .pipe(
        catchError((err) => {
          console.error('Error getting notifications', err);
          return of(null);
        }),
        switchMap((summary) => this.setNotificationSummary.emit(summary))
      )
      .subscribe();

    // listener for the show subscription cancelled popup
    this.showSubscriptionCancelledPopup$
      .pipe(
        take(1),
        switchMap((isSubscriptionCancelled) => {
          // verify if the subscription is cancelled
          if (isSubscriptionCancelled) {
            // show popup for the subscription downgraded
            return this._modalService
              .message(
                'Your account has been downgraded',
                `The 3rd party payment arrangement is no longer active.
                                As such your subscription that allows you to have multiple horses enabled on your account has been cancelled.
                                You can log into your account to change which horse you would like to have enabled,
                                or you can setup direct payment from your own account, or re-establish a payment arrangement to enable
                                 multiple horses again.`,
                'Close'
              )
              .afterClosed();
          }
          return of(undefined);
        }),
        // reset the subscription cancelled flag
        switchMap(() =>
          this._store.dispatch(new ResetShowSubscriptionCancelledPopup())
        )
      )
      .subscribe();

    this._mediaUploadQueueService
      .getAllFromStorage()
      .then((items) => {
        // rehydrate the media upload queue
        this.rehydrateMediaUploadQueue.emit(items);
        // set the current uploading item
        this._store.dispatch(
          new SetCurrentUploadingItemAction(
            // get the first item in the queue
            items && items.length > 0 ? items[0].mediaId : ''
          )
        );
      })
      .catch((err) => {
        this.rehydrateMediaUploadQueue.emit([]);
        console.error('Error getting media upload queue', err);
      });
  }

  ionViewWillEnter(): void {
    interval(10000)
      .pipe(
        takeUntil(this._onViewWillLeave$),
        switchMap(() => this._capacitorPluginService.networkStatus()),
      )
      .subscribe(({ connected }) => {
        if (!this._mediaUploadQueueService.isSyncInProcess && connected) {
          this._mediaUploadQueueService.sync().subscribe();
        }
      });
  }

  public navigateToUploadGallery(): void {
    this._router.navigate(['tabs', 'upload-gallery']);
  }

  public ionViewWillLeave(): void {
    this._onViewWillLeave$.next();
    this._onViewWillLeave$.complete();
  }
}
