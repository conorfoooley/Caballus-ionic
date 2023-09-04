import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ModalService, SwipeDirection } from '@caballus/ui-common';
import { getChildRouteData } from '@ion-caballus/core/util/route';
import { Gesture, GestureController, GestureDetail } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { SubMenuBarComponent } from './components/sub-menu-bar.component';
import { NavigationState, UserState } from '@ion-caballus/core/state';
import { NotificationSummary } from '@caballus/common';
import { Select, Store } from '@ngxs/store';

import { ShepherdService } from 'angular-shepherd';
import Step from 'shepherd.js/src/types/step';
import { FetchNavigationAction, GetTourAction, SetTourAction } from '@ion-caballus/core/state/actions';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationBarComponent implements OnInit {
  private _onDestroy$: Subject<void> = new Subject();
  public notifications: {
    messaging: boolean;
  } = {
    messaging: false
  };
  public enableSubMenu$: Observable<boolean> = this._router.events.pipe(
    takeUntil(this._onDestroy$),
    filter(evt => evt instanceof NavigationEnd),
    map(() => getChildRouteData(this._router.routerState.snapshot, 'data', 'enableSubMenu'))
  );
  @ViewChild('content', { static: true }) public content: ElementRef;
  @ViewChild('subMenu', { static: false }) public subMenu: SubMenuBarComponent;

  @Select(UserState.notificationSummary)
  public notifications$: Observable<NotificationSummary>;

  @Select(UserState.tour)
  public tour$: Observable<boolean>;

  @Select(NavigationState.activeNavigation)
  public activatedNavigation$: Observable<string>;

  public isNotificationSetting: boolean;

  public builtInButtons = {
    cancel: {
      classes: 'cancel-button large-round',
      // secondary: true,
      text: 'Got it',
      type: 'cancel',
      events: {
        click: function() {
          // return Shepherd.activeTour.show('some_step_name');
          alert('asdfasfdasdf');
          console.log('asdfasdfasdfasdf');
        }
      }
    },
    next: {
      classes: 'next-button large-round',
      text: 'Next',
      type: 'next',
      events: {
        click: function() {
          // return Shepherd.activeTour.show('some_step_name');
          alert('asdfasfdasdf');
          console.log('asdfasdfasdfasdf');
        }
      }
    },
    tour: {
      classes: 'next-button',
      text: 'TAKE A TOUR',
      type: 'next',
      events: {
        click: function() {
          // return Shepherd.activeTour.show('some_step_name');
          alert('asdfasfdasdf');
          console.log('asdfasdfasdfasdf');
        }
      }
    },
    back: {
      classes: 'back-button',
      secondary: true,
      text: 'Return',
      type: 'back',
      events: {
        click: function() {
          // return Shepherd.activeTour.show('some_step_name');
          alert('asdfasfdasdf');
          console.log('asdfasdfasdfasdf');
        }
      }
    }
  };

  public defaultStepOptions: Step.StepOptions = {
    classes: 'shepherd-theme-arrows custom-default-class',
    scrollTo: false,
    cancelIcon: {
      enabled: true
    }
  };

  public steps: Step.StepOptions[] = [
    /*  {
        arrow: false,
        buttons: [this.builtInButtons.back, this.builtInButtons.tour],
        classes: 'custom-class-name-1 custom-class-name-2',
        id: 'getttingstarted',
        title: 'Getting Started',
        text: `You can start a ride almost immediately. Select one or more horses at the top of the screen
    (click "Quick Add" if no horses exist), then click "Start Ride".`
    }, */
    {
      attachTo: {
        element: '.nav-notifications',
        on: 'top'
      },
      buttons: [this.builtInButtons.next],
      classes: 'custom-class-name-1 custom-class-name-2',
      id: 'notifications',
      title: 'Notifications',
      text: `Be notified of friend invitations, when your friends go on rides, and when they share
        photos, etc`
    },
    {
      attachTo: {
        element: '.nav-horse-profile',
        on: 'top'
      },
      buttons: [/* builtInButtons.back, */ this.builtInButtons.next],
      classes: 'custom-class-name-1 custom-class-name-2',
      id: 'horse-prfile',
      title: 'Horse Profile',
      text:
        'View your horses and their data. Upload their health information, evaluations, and see their ride history.'
    },
    {
      attachTo: {
        element: '.nav-map-my-ride',
        on: 'top'
      },
      buttons: [/* this.builtInButtons.back, */ this.builtInButtons.next],
      classes: 'custom-class-name-1 custom-class-name-2',
      id: 'map-ride',
      title: 'Map Ride',
      text:
        'Map your ride with your horse. Add photos, edit gait speed, and share with friends.'
    },
    {
      attachTo: {
        element: '.nav-tips',
        on: 'top'
      },
      buttons: [/* this.builtInButtons.back, */ this.builtInButtons.next],
      classes: 'custom-class-name-1 custom-class-name-2',
      id: 'tips',
      title: 'Friends',
      text: `Share horse and rider profiles with others including trainers or other riders. View and send friend requests here!`
    },
    {
      attachTo: {
        element: '.nav-menu',
        on: 'top'
      },
      buttons: [this.builtInButtons.cancel],
      classes: 'custom-class-name-1 custom-class-name-2',
      id: 'nav-menu',
      title: 'Menu',
      text: `Edit your account, notification settings, and subscription status.`
    } /*
    {
        buttons: [this.builtInButtons.cancel, this.builtInButtons.back],
        id: 'noAttachTo',
        title: 'Centered Modals',
        classes: 'custom-class-name-1 custom-class-name-2',
        text:
            'If no attachTo is specified, the modal will appear in the center of the screen, as per the Shepherd docs.'
    } */
  ];

  constructor(
    private readonly _gestureController: GestureController,
    private readonly _modalService: ModalService,
    // private bdcWalkService: BdcWalkService,
    private readonly _router: Router,
    private readonly _store: Store,
    private shepherdService: ShepherdService
  ) {
  }

  public ngOnInit(): void {
    this._createGestureElement();
  }

  public ngAfterViewInit() {
    this._store.dispatch(new GetTourAction()).subscribe(() => {
      this.tour$.subscribe(t => {
        if (t !== false) {
          this._modalService
            .openActionDialog(
              'Getting Started',
              `You can start a ride almost immediately. Select one or more horses at the top of the screen
                        (click "Quick Add" if no horses exist), then click "Start Ride".`,
              'RETURN',
              'TAKE A TOUR'
            )
            .afterClosed()
            .subscribe(res => {
              if (res == 'Button2') {
                this.shepherdService.defaultStepOptions = this.defaultStepOptions;
                this.shepherdService.modal = true;
                // this.shepherdService.confirmCancel = false;
                this.shepherdService.addSteps(this.steps);
                this.shepherdService.start();
              }
              this._store.dispatch(new SetTourAction());
            });
        }
      });
    });
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  private _createGestureElement(): void {
    const gesture: Gesture = this._gestureController.create(
      {
        el: this.content.nativeElement,
        threshold: 15,
        gestureName: 'my-gesture',
        onEnd: (e: GestureDetail): void => {
          this._onSwipe(e);
        },
        direction: 'y'
      },
      true
    );
    gesture.enable();
  }

  private _onSwipe(e: GestureDetail): void {
    const swipeDirection = e.currentY < e.startY ? SwipeDirection.Up : SwipeDirection.Down;
    switch (swipeDirection) {
      case SwipeDirection.Up:
        this.subMenu?.showHideSubMenu(true);
        break;
      case SwipeDirection.Down:
        this.subMenu?.showHideSubMenu(false);
        break;
      default:
        break;
    }
  }

  public tabOnClick(): void {
    this._store.dispatch(FetchNavigationAction);
  }
}
