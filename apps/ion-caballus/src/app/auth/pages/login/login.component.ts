import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  kilometersToMiles,
  milesToMeters,
  ModalService,
  PlatformType,
  Ride,
  RideStatus,
  User,
  UserDeviceInfo,
  WayPoint,
  WEB_APP_VERSION
} from '@caballus/ui-common';
import { LoginAction } from '@ion-caballus/core/state/actions';
import { environment } from '@ion-caballus/env';
import { CacheService, CapacitorPluginService } from '@ion-caballus/core/services';
import { BehaviorSubject, combineLatest, from, Observable, of, Subject } from 'rxjs';
import { catchError, delay, map, mapTo, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ToastService } from '@rfx/ngx-toast';
import { HttpErrorResponse } from '@angular/common/http';
import { Select, Store } from '@ngxs/store';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import getBrowserFingerprint from 'get-browser-fingerprint';
import { detect } from 'detect-browser';
import { AuthState, RideState, UserState } from '@ion-caballus/core/state';
import moment from 'moment';
import { Geolocation } from '@capacitor/geolocation';
import { wayPointKilometers } from 'libs/common/src/lib/utils/ride-calculations';
import { Emittable, Emitter } from '@ngxs-labs/emitter';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  @Select(AuthState.authToken)
  public authToken$!: Observable<string>;
  @Select(AuthState.refreshToken)
  public refreshToken$!: Observable<string>;
  @Select(UserState.user)
  public user$!: Observable<User>;
  @Select(RideState)
  public ride$!: Observable<Ride | null>;
  @Emitter(RideState.endRide)
  public endRide!: Emittable<void>;

  public submitting$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  public form: FormGroup = this._formBuilder.group({
    email: [null, [Validators.required, Validators.email]],
    password: [null, Validators.required]
  });
  public validations = {
    email: [
      { type: 'required', message: 'Email is required.' },
      { type: 'email', message: ' Please enter a valid email address.' }
    ],
    password: [{ type: 'required', message: 'Password is required.' }]
  };
  private _onSubmit$: Subject<void> = new Subject();
  private _onViewWillLeave$: Subject<void> = new Subject();

  private _redirectUrl$: Observable<string> =
    this._activatedRoute.queryParams.pipe(
      take(1),
      map((params) => params.redirect || ''),
      shareReplay(1)
    );

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _toastService: ToastService,
    private readonly _router: Router,
    private readonly _store: Store,
    private readonly _cacheService: CacheService,
    private readonly _capacitorPluginService: CapacitorPluginService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _modalService: ModalService
  ) {
  }

  public ngOnInit(): void {
  }

  public ionViewWillEnter(): void {
    this.form.valueChanges
      .pipe(
        takeUntil(this._onViewWillLeave$),
        tap((value) => {
          if (value.email.includes(' ')) {
            this.form.patchValue({
              email: value.email.trim()
            });
          }
        })
      )
      .subscribe();

    this._onSubmit$
      .pipe(
        takeUntil(this._onViewWillLeave$),
        tap(() => {
          this.form.markAllAsTouched();
          this.form.updateValueAndValidity();
        })
      )
      .subscribe();

    if (!environment.production) {
      this.form.patchValue({
        email: 'ben@riafox.com',
        password: 'Ria@12345'
      });
    }
  }

  public ionViewWillLeave(): void {
    this._onViewWillLeave$.next();
    this._onViewWillLeave$.complete();
  }

  public async login(): Promise<void> {
    if (this.form.invalid) {
      this._toastService.error('Check form for errors');
      return;
    }
    this.submitting$.next(true);
    this._store
      .dispatch(
        new LoginAction(
          this.form.value.email,
          this.form.value.password,
          await this._deviceInfo()
        )
      )
      .pipe(
        switchMap(() => combineLatest([this._redirectUrl$, this.ride$])),
        switchMap(([redirect, ride]) => {
          this.submitting$.next(false);
          // verify if ride is exist and it's in process
          if (
            ride &&
            ride.rideStatus === RideStatus.InProgress &&
            ride.paths.length
          ) {
            const clonedRide = { ...ride };

            // sort ride paths by latest wayPoints
            clonedRide.paths = clonedRide?.paths?.map((path) => {
              path.wayPoints = path.wayPoints.sort((wp1, wp2) => {
                const timeStamp1 = moment(
                  moment.utc(wp1.timestamp).toDate()
                ).local();
                const timeStamp2 = moment(
                  moment.utc(wp2.timestamp).toDate()
                ).local();
                return moment
                  .duration(timeStamp2.diff(timeStamp1))
                  .as('milliseconds');
              });
              return path;
            });

            // sort ride paths
            clonedRide.paths = clonedRide?.paths?.sort((path1, path2) => {
              const timeStamp1 = moment(
                moment.utc(path1.startDateTime).toDate()
              ).local();
              const timeStamp2 = moment(
                moment.utc(path2.startDateTime).toDate()
              ).local();
              return moment
                .duration(timeStamp2.diff(timeStamp1))
                .as('milliseconds');
            });

            // calculate totalDuration between last wayPoint timestamp and the current timestamp
            const totalDuration =
              new Date().getTime() -
              new Date(clonedRide.paths[0].wayPoints[0].timestamp).getTime();

            // verify if the timeduration is grater than or equal to 10 minutes
            if (
              totalDuration >= moment.duration(10, 'minutes').asMilliseconds()
            ) {
              return from(Geolocation.getCurrentPosition()).pipe(
                map((coordinates) => {
                  // calculate wayPointKilometers and then convert them to miles
                  return kilometersToMiles(
                    wayPointKilometers(
                      clonedRide.paths[0].wayPoints[0],
                      new WayPoint(coordinates.coords)
                    )
                  );
                }),
                switchMap((distance) => {
                  // only continue if distance is grater than 200 meters
                  if (milesToMeters(distance) < 200) {
                    return of(redirect);
                  }
                  const momentTimeDistance = moment.utc(totalDuration);
                  // show modal popup for terminating or continue the ride.
                  return this._modalService
                    .confirm(
                      'End Ride?',
                      `A ride was in progress when the app terminated, ${momentTimeDistance.format(
                        'HH'
                      )} Hours and ${momentTimeDistance.format(
                        'mm'
                      )} Minutes ago, from ${distance.toFixed()} miles away.  Do you wish to continue this ride (note that the ride duration and distance may not be accurate, and you should include this in your ride notes).`,
                      'Continue Ride',
                      'End Ride'
                    )
                    .afterClosed()
                    .pipe(
                      switchMap((res) => {
                        if (res) {
                          // show continue ride message and redirect to the next page
                          this._toastService.success(
                            'Continuing ride currently in progress.'
                          );
                          return of(redirect).pipe(delay(300));
                        } else {
                          // show ending ride message
                          this._toastService.success(
                            'Ending ride previously in progress.'
                          );

                          // end the ride and then navigate to the next page
                          return this.endRide.emit().pipe(mapTo(redirect));
                        }
                      })
                    );
                })
              );
            }
          } else {
            return of(redirect);
          }
        }),
        tap((redirect) => {
          this._toastService.success('Logged in');
          this._router.navigateByUrl(redirect || '/tabs/map-my-ride');

          // start syncing the cached data
          this._cacheService.sync().subscribe();
        }),
        catchError((err) => {
          console.error(err);
          this.submitting$.next(false);
          this._toastService.error(
            err instanceof HttpErrorResponse
              ? err.error.message
              : 'Wrong email/password combination'
          );
          return of(undefined);
        }),
        takeUntil(this._onViewWillLeave$)
      )
      .subscribe();
  }

  private async _deviceInfo(): Promise<UserDeviceInfo> {
    const platform =
      this._capacitorPluginService.isNativeAppPlatform().platform;
    if (platform === PlatformType.Web) {
      const webInfo = detect();
      const fingerprint = getBrowserFingerprint();
      const deviceInfoObj = new UserDeviceInfo({
        deviceId: String(fingerprint),
        os: webInfo.os,
        osVersion: webInfo.version,
        deviceName: webInfo.name,
        deviceModel: '',
        ramAvailable: 0,
        platform: this._capacitorPluginService.isNativeAppPlatform().platform,
        appInfo: [
          {
            appVersion: WEB_APP_VERSION,
            loginAt: new Date()
          }
        ]
      });
      return deviceInfoObj;
    }
    const deviceId = await Device.getId();
    const info = await Device.getInfo();
    const appInfo = await App.getInfo();
    const deviceInfo = new UserDeviceInfo({
      deviceId: deviceId.uuid,
      os: info.operatingSystem,
      osVersion: info.osVersion,
      deviceName: info.name,
      deviceModel: info.model,
      ramAvailable: info.realDiskFree,
      platform: this._capacitorPluginService.isNativeAppPlatform().platform,
      appInfo: [
        {
          appVersion: appInfo.version,
          loginAt: new Date()
        }
      ]
    });
    return deviceInfo;
  }
}
