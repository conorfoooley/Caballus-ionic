import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import {
    AppRideStatus,
    calculateRideTime,
    CurrentRide,
    HorseForRide,
    HorseIdentityWithGaits,
    HorseService,
    MINIMUM_RIDE_DURATION,
    ModalService as AlertService,
    ModalService as CommonModalService,
    RideService,
    User,
    UserService
} from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { RideState, UserState } from '@ion-caballus/core/state';
import { CapacitorPluginService, LocationService, ModalService } from '@ion-caballus/core/services';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of, race, Subject } from 'rxjs';
import {
    catchError,
    distinctUntilChanged,
    filter,
    find,
    map,
    skip,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { ConnectionStatus } from '@capacitor/network';
import { AlertController } from '@ionic/angular';
import { Emittable, Emitter } from '@ngxs-labs/emitter';
import { HorseSelectBannerComponent } from '../../components/horse-select-banner/horse-select-banner.component';
import { Location } from '@capacitor-community/background-geolocation';
import _ from 'lodash';
import { THOUSAND } from '@caballus/common';

export interface StartRideDetails {
    horseIdentities: HorseIdentityWithGaits[];
    riderIdentity: User;
}

export interface EndRideDetails {
    duration: number;
    durationIsLessThanMinimum: boolean;
    message: string;
    rideId: string;
}

const ALERT_DISMISS_TIME = 5000;

@Component({
    selector: 'caballus-app-map-my-ride',
    templateUrl: './map-my-ride.component.html',
    styleUrls: ['./map-my-ride.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapMyRideComponent implements OnInit {
    @ViewChild('horseSelectBanner', { static: true })
    public horseSelectBanner!: HorseSelectBannerComponent;

    @Select(UserState.user)
    public user$!: Observable<User>;

    public horseControl: FormControl = new FormControl([]);

    @Select(RideState)
    public ride$!: Observable<CurrentRide | null>;

    @Emitter(RideState.addWayPoint)
    public addWayPoint!: Emittable<Location>;
    @Emitter(RideState.startRide)
    public startRide!: Emittable<StartRideDetails>;
    @Emitter(RideState.pauseRide)
    public pauseRide!: Emittable<void>;
    @Emitter(RideState.resumeRide)
    public resumeRide!: Emittable<void>;
    @Emitter(RideState.endRide)
    public endRide!: Emittable<void>;
    @Emitter(RideState.clear)
    public clearRide!: Emittable<void>;
    @Emitter(RideState.didShowGpsWarning)
    public didShowGpsWarning!: Emittable<void>;
    @Emitter(RideState.cancel)
    private readonly _cancelRide!: Emittable<void>;

    public startingRide$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public horsesForRide$: Subject<HorseForRide[]> = new Subject();
    public centerPosition$: Subject<Location> = new Subject();
    public myLivePosition$: Subject<Location> = new Subject();

    private _onDestroy$: Subject<void> = new Subject();

    constructor(
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _capacitorPluginService: CapacitorPluginService,
        private readonly _horseService: HorseService,
        private readonly _modalService: ModalService,
        private readonly _alertService: AlertService,
        private readonly _userService: UserService,
        private readonly _router: Router,
        private readonly _alertController: AlertController,
        private readonly _commonModalService: CommonModalService,
        private readonly _locationService: LocationService,
        private readonly _rideService: RideService
    ) {}

    public ngOnInit(): void {
        // Ion view events don't work right with tabs
        // https://github.com/ionic-team/ionic-framework/issues/15260#issuecomment-420595107
        this._router.events
            .pipe(
                takeUntil(this._onDestroy$),
                filter(event => event instanceof NavigationEnd && event.url === '/tabs/map-my-ride')
            )
            .subscribe(_ => this.onEnter());

        // Whenever the ride goes to "riding" status we should start recording
        // the location to the current path
        this.ride$
            .pipe(
                takeUntil(this._onDestroy$),
                map(x => x?.appRideStatus),
                distinctUntilChanged(),
                filter(status => status === AppRideStatus.Riding),
                switchMap(_ =>
                    this._locationService.position$.pipe(
                        // Skip the first 5 or so to make sure the GPS can acquire a
                        // decent lock
                        // skip(5),
                        // Keep recording position until the current ride leaves the
                        // riding state
                        //
                        // TODO make a dynamic selector for the ride statuses so that
                        // it's not so verbose
                        takeUntil(
                            race(
                                this._onDestroy$,
                                this.ride$.pipe(
                                    map(x => x?.appRideStatus),
                                    find(status => status !== AppRideStatus.Riding)
                                )
                            )
                        )
                    )
                )
            )
            .subscribe(position => {
                this.addWayPoint.emit(position);
                // hide the starting ride loder after we get first positions from GPS plugin.
                this.startingRide$.next(false);
            });
    }

    public onEnter(): void {
        // get current position from GPS plugin to set map center
        this._locationService.position$.pipe(take(5)).subscribe(position => {
            // set the center position
            this.centerPosition$.next(position);
        });

        // get current position from GPS plugin
        this._locationService.position$.subscribe(position => {
            // set the current position
            this.myLivePosition$.next(position);
        });

        this._testGpsSignal();

        /*
        Restore current ride if it exists
    */
        this.ride$.pipe(take(1)).subscribe(ride => {
            if (!ride) {
                return;
            }

            switch (ride.appRideStatus) {
                case AppRideStatus.Riding:
                    // Need to spool up location recording if continuing an
                    // existing ride when the app is launched?
                    break;
                case AppRideStatus.Paused:
                    this.pauseRide.emit();
                    break;
                case AppRideStatus.EndRideDetails:
                    this._router.navigate(['/tabs/map-my-ride/end-ride-details'], {
                        replaceUrl: true
                    });
                    return;
                case AppRideStatus.Finalized:
                    this.clearRide.emit();
                    return;
                default:
                    // do nothing
                    break;
            }
        });

        this._horseCache
            .getHorsesForRide()
            .pipe(take(1))
            .subscribe(value => {
                this.horsesForRide$.next(value);
            });
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public startNewRide(): void {
        const horseIds = this.horseControl.value;
        if (horseIds.length === 0) {
            this._toastService.error('Select at least one horse to ride');
            return;
        }
        this.startingRide$.next(true);
        combineLatest([
            this._horseCache.getHorsesForRide(),
            this._capacitorPluginService.networkStatus()
        ])
            .pipe(
                take(1),
                switchMap(([available, network]) =>
                    this._checkOccupiedHorses(available, horseIds, network)
                ),
                tap(finalSelection => {
                    this.horseControl.setValue(finalSelection.map(h => h._id));
                    this.horseSelectBanner.clearSearch();
                }),
                switchMap(finalSelection => {
                    if (finalSelection.length === 0) {
                        throw new Error('Select at least one horse to ride');
                    }

                    return this._recordNewRide(finalSelection);
                }),
                catchError(err => {
                    console.error(err);
                    this._toastService.error(err);
                    return of(undefined);
                })
            )
            .subscribe();
    }

    private _checkOccupiedHorses(
        available: HorseForRide[],
        selectedIds: string[],
        network: ConnectionStatus
    ): Observable<HorseForRide[]> {
        const selectedHorses = available.filter(horse => selectedIds.includes(horse._id));
        if (!network.connected) {
            return of(selectedHorses);
        }

        const ids = selectedHorses.map(horse => horse._id);
        return this._horseService.getHorsesOnRide({ ids }).pipe(
            switchMap(rides => {
                const occupiedIds = _.chain(rides)
                    .flatMap(ride => ride.horseIdentities)
                    .map(value => value._id as string)
                    .value();

                const [occupied, notOccupied] = _.partition(selectedHorses, horse =>
                    occupiedIds.includes(horse._id)
                );

                if (occupied.length === 0) {
                    return of(notOccupied);
                }

                const observables: Observable<{ id: string; include: boolean }>[] = occupied.map(
                    horse => {
                        const ride = _.find(rides, { horseIdentities: [{ _id: horse._id }] });

                        return this._modalService.occupiedHorse(horse, ride);
                    }
                );

                return forkJoin(observables).pipe(
                    map(results => {
                        const confirmedIds = results
                            .filter(result => result.include)
                            .map(result => result.id);

                        const confirmed = occupied.filter(occupiedHorse =>
                            confirmedIds.includes(occupiedHorse._id)
                        );

                        return [...confirmed, ...notOccupied];
                    })
                );
            })
        );
    }

    private _recordNewRide(selection: HorseForRide[]): Observable<unknown> {
        const horseIdentities = selection.map(
            horse =>
                new HorseIdentityWithGaits({
                    ...horse,
                    label: horse.commonName,
                    picture: horse.profilePicture,
                    gaitsKilometersPerHourSnapshot: horse.gaitsKilometersPerHour
                })
        );

        return this.user$.pipe(
            take(1),
            // Want to test the GPS signal when the ride starts
            tap(() => this._testGpsSignal()),
            switchMap(user => this.startRide.emit({ horseIdentities, riderIdentity: user }))
        );
    }

    public pauseRideButton(): void {
        this.pauseRide.emit();
    }

    public resumeRideButton(): void {
        this._testGpsSignal();
        this.resumeRide.emit();
    }

    public endRideButton(): void {
        let rideDetails: EndRideDetails;
        this._getEndRideDetails().subscribe(details => (rideDetails = details));

        this._commonModalService
            .openActionDialog('End Ride', rideDetails.message, 'No, Go Back', 'Yes, End Ride')
            .afterClosed()
            .subscribe(button => {
                if (button === 'Button2') {
                    rideDetails.durationIsLessThanMinimum
                        ? this._deleteInCompleteRide(rideDetails.rideId)
                        : this._endRideConfirmed();
                    return;
                }

                // No-Op for Button1
            });
    }

    private _getEndRideDetails(): Observable<EndRideDetails> {
        return this.ride$.pipe(
            take(1),
            map(ride => {
                const details: EndRideDetails = {
                    duration: 0,
                    durationIsLessThanMinimum: false,
                    message: '',
                    rideId: ''
                };

                if (!ride) {
                    details.message = `Your ride is less than ${
                        MINIMUM_RIDE_DURATION / THOUSAND
                    } seconds if you stop your ride now the ride will be deleted.`;
                    return details;
                }

                details.rideId = ride._id;
                details.duration = calculateRideTime(ride);
                details.durationIsLessThanMinimum = details.duration < MINIMUM_RIDE_DURATION;
                details.message = details.durationIsLessThanMinimum
                    ? `Your ride is less than ${
                          MINIMUM_RIDE_DURATION / THOUSAND
                      } seconds if you stop your ride now the ride will be deleted.`
                    : 'Are you sure you want to end this ride? The ride will be ended for all horses in use. ';

                return details;
            })
        );
    }

    private _deleteInCompleteRide(rideId: string): void {
        this._rideService.deleteRide(rideId).subscribe(() => {
            this._cancelRide.emit();
            this._toastService.info('Ride deleted');
            this._router.navigate(['/tabs/map-my-ride']);
        });
    }

    private _endRideConfirmed(): void {
        this._userService.completedHisFirstRide().subscribe();
        this.endRide.emit();
        this._router.navigate(['/tabs/map-my-ride/end-ride-details'], {
            replaceUrl: true
        });
    }

    public openTourModal(): void {
        this._alertService
            .openActionDialog(
                'Getting Started',
                'You can start a ride almost immediately. ' +
                    'Select one or more horses at the top of the screen (click "Quick Add" if no horses exist), then click "Start Ride".',
                'Return',
                'Take a Tour'
            )
            .afterClosed()
            .pipe(
                take(1),
                tap(async button => {
                    if (button && button === 'Button2') {
                        const alert = await this._alertController.create({
                            message: 'App Tour',
                            buttons: ['OK']
                        });
                        await alert.present();
                        setTimeout(() => {
                            alert.dismiss();
                        }, ALERT_DISMISS_TIME);
                    }
                })
            )
            .subscribe();
    }

    // Instead of monitoring the location accuracy the whole time just call
    // this function at certain lifecycle events of the ride. Any other time
    // the user is not likely to be looking at the app at which point the
    // warning is useless.
    private _testGpsSignal(): void {
        const location$ = this._locationService.position$.pipe(skip(5), take(1));
        const ride$ = this.ride$.pipe(take(1));
        // I usually try to avoid mixing async and observables but
        // AlertController has a really weird interface that's hard to work
        // with without async/await
        forkJoin([ride$, location$]).subscribe(async ([ride, position]) => {
            if (!ride || ride.didShowGpsWarning) {
                return;
            }

            let alert: HTMLIonAlertElement;
            if (position.accuracy > 50) {
                alert = await this._alertController.create({
                    buttons: [{ text: 'OK', role: 'ok' }],
                    header: 'NO GPS',
                    message: `
                        There is no detectable GPS signal here. The tracking
                        data will therefore be very inaccuracy. The duration
                        however will be accurate and can be used to demonstrate
                        that a ride has taken place.
                    `
                });
            } else if (position.accuracy > 20) {
                alert = await this._alertController.create({
                    buttons: [{ text: 'OK', role: 'ok' }],
                    header: 'WARNING',
                    message: `
                        Your GPS signal is poor here. It is likely that your
                        tracking accuracy will be affected. You may wish to
                        indicate this in the notes at the end of the ride.
                    `
                });
            } else {
                return;
            }

            await alert.present();
            const { role } = await alert.onDidDismiss();
            this.didShowGpsWarning.emit();
            if (role === 'cancel') {
                // User decided that ending the ride is the best bet here
                this.endRide.emit();
                return;
            }

            // Otherwise do nothing
        });
    }
}
