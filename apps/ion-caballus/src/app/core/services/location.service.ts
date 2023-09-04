import { Injectable } from '@angular/core';
import { BackgroundGeolocationPlugin, Location } from '@capacitor-community/background-geolocation';
import { Observable, Subject, defer, Observer, interval, of } from 'rxjs';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { tap, filter, map, share, switchMap } from 'rxjs/operators';
import { RIDE_POSITION_MINIMUM_ACCURACY_METERS$ } from 'libs/common/src/lib/constants/constants';
import { ToastService } from '@rfx/ngx-toast';
import { ModalService } from '@caballus/ui-common';

const BackgroundGeolocation = registerPlugin(
    'BackgroundGeolocation'
) as BackgroundGeolocationPlugin;

const SIMULATED_LOCATION_INTERVAL = 1000;

/**
 * A stateful filter for values of type T
 *
 * Takes an input value and returns an altered copy of that value based on the
 * behavior of the filter. May use internal mutability.
 *
 * @typeParam T type of the values being filtered
 */
interface Filter<T> {
    /**
     * Takes a value and returns an altered copy while altering any internal
     * state as necessary.
     */
    filter(value: T): T;
}

/**
 * Internal state for LocationFilter
 *
 * @internal
 */
interface LocationFilterState {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number;
    covariance: number;
}

class LocationFilter implements Filter<Location> {
    private state: LocationFilterState | null = null;

    /**
     * Pass in a location to process it and return the corrected location
     */
    public filter(location: Location): Location {
        // Minimum accuracy to prevent overvaluing more accurate coordinates
        //
        // I think? Can't tell if it actually makes a difference or not.
        //
        // example:
        // const MINIMUM_ACCURACY = 15;
        // const accuracy = Math.min(location.accuracy, MINIMUM_ACCURACY);
        const accuracy = location.accuracy;
        const measuredVariance = Math.pow(accuracy, 2);
        if (!this.state) {
            this.state = {
                timestamp: location.time,
                latitude: location.latitude,
                longitude: location.longitude,
                altitude: location.altitude,
                covariance: measuredVariance
            };

            // Can't do any filtering with just the first point
            return location;
        }

        // PREDICT PHASE

        const state = this.state;
        const deltaT = location.time - state.timestamp;
        if (deltaT < 0) {
            // Ignore out of order points
            return location;
        }

        // Uncertainty goes up with passed time
        //
        // TODO Maybe switch speed factors depending on gait... which is
        // dependent on speed. Will need to test and see if the cyclic nature
        // of that will cause issues.
        //
        // Integrating speed will likely involve adding another dimension to
        // the accuracy factor and change the math into linear algebra so that
        // will be a last resort.
        const speed = 3; // meters per second
        const covariance = state.covariance + (deltaT / 1000) * Math.pow(speed, 2);

        // UPDATE PHASE

        // TODO Use velocity (speed + bearing) information to better predict
        // location
        //
        // e.g. state = [x, y, vx, vy] or [lat, long, speed, bearing]
        // see note above about increased complexity

        // Kalman gain matrix
        // K = Covarariance * Inverse(Covariance + MeasurementVariance)
        //
        // NOTE: because K is dimensionless, it doesn't matter that
        // variance has different units to lat and lng
        const K = covariance / (covariance + measuredVariance);
        const correctedLatitude = state.latitude + K * (location.latitude - state.latitude);
        const correctedLongitude = state.longitude + K * (location.longitude - state.longitude);

        // Altitude has its own accuracy value that could likely be put into a
        // separate filter but I think the accuracy is congruent enough to the
        // location accuracy that we can lump it into the same correction
        // factor.
        const correctedAltitude = state.altitude + K * (location.altitude - state.altitude);

        this.state = {
            timestamp: location.time,
            latitude: correctedLatitude,
            longitude: correctedLongitude,
            altitude: correctedAltitude,
            // new Covarariance matrix is (IdentityMatrix - K) * Covariance
            covariance: (1 - K) * covariance
        };

        // END FILTER

        return {
            ...location,
            latitude: correctedLatitude,
            longitude: correctedLongitude,
            altitude: correctedAltitude
        };
    }
}

const WATCHER_OPTIONS = {
    backgroundTitle: 'Mapping Your Ride',
    backgroundMessage: 'Using your location',
    requestPermissions: true,
    stale: false,
    // The distance filtering is going to be done manually, and will happen
    // after accuracy filtering
    distanceFilter: 0
};

function simulatedLocation(): Location {
    function pad(value: number, scale: number) {
        const padding = Math.random() - 0.5;
        const paddedValue = value + padding * scale;

        return paddedValue;
    }

    return {
        latitude: pad(43.60744144799341, 0.0001),
        longitude: pad(-116.5052570155064, 0.0001),
        accuracy: 0,
        altitude: pad(2730, 1),
        altitudeAccuracy: 0,
        bearing: 0,
        speed: 0,
        time: new Date().getTime(),
        simulated: true
    };
}

@Injectable({ providedIn: 'root' })
export class LocationService {
    private _positionAccuracy$: Subject<number | null> = new Subject();

    /**
     * On subscribe: starts emitting the users current position at a regular
     * interval.
     */
    public position$: Observable<Location>;

    /**
     * The current measured accuracy from the GPS readings if any
     *
     * This bypasses any filtering on the actual readings and updates on each
     * and every emission from the location API.
     */
    public accuracy$: Observable<number | null> = this._positionAccuracy$;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _modalService: ModalService
    ) {
        // Location should be shared subscription, only one gps watcher at a
        // time but stop when every subscriber unsubs and reset.
        //
        // The options for resetting aren't in this version of rxjs, hopefully
        // it has behavior that is aligned with my expectations.
        this.position$ = defer(() => this._createLocationStream()).pipe(share());
    }

    private createWatcher(): Observable<Location> {
        return new Observable((subscriber: Observer<Location>) => {
            // Since we can't wait for the id we return early. If the
            // unsubscribe callback is hit before the watcher id callback then
            // we will mark it as undefined so that the watcher is removed by
            // the watcher callback instead of the unsubscribe callback.
            let id: string | null | undefined = null;
            BackgroundGeolocation.addWatcher(WATCHER_OPTIONS, (position, error) => {
                if (error) {
                    if (error.code === 'NOT_AUTHORIZED') {
                        this._modalService
                            .confirm(
                                `Unable to Locate`,
                                `This app needs your location, but does not have permission.`,
                                `Open settings now?`
                            )
                            .afterClosed()
                            .pipe(
                                switchMap(res => {
                                    if (res) {
                                        return BackgroundGeolocation.openSettings();
                                    }
                                })
                            );
                    }
                    return subscriber.error(error);
                }

                subscriber.next(position);
            }).then(watcherId => {
                if (typeof id === 'undefined') {
                    // unsubscribe has already happened, just remove the
                    // watcher.
                    BackgroundGeolocation.removeWatcher({ id: watcherId });
                } else {
                    // mutating variables from async callbacks is
                    // absolutely cursed but this plugin has a weird
                    // interface to cram into an observable
                    id = watcherId;
                }
            });

            // Disposal function, called on unsubscribe
            return () => {
                if (id) {
                    // If the id is available yet, go ahead and remove the
                    // watcher
                    BackgroundGeolocation.removeWatcher({ id });
                }

                // Mark the id as disposed, if the watcher hasn't been removed
                // just now, this status should be used to remove it once the
                // id is available.
                id = undefined;
                this._positionAccuracy$.next(null);
            };
        });
    }

    private _createLocationStream(): Observable<Location> {
        if (Capacitor.isPluginAvailable('BackgroundGeolocation')) {
            // Platform with GPS available
            const processor = new LocationFilter();
            return this.createWatcher().pipe(
                tap(position => {
                    this._positionAccuracy$.next(position.accuracy);
                }),
                filter(
                    position => position.accuracy < RIDE_POSITION_MINIMUM_ACCURACY_METERS$.value
                ),
                map(position => processor.filter(position))
            );
        } else {
            this._toastService.info('We are unable to identify your location at this time.');

            // Default simulated location
            return interval(SIMULATED_LOCATION_INTERVAL).pipe(
                map(() => simulatedLocation()),
                tap(position => {
                    this._positionAccuracy$.next(position.accuracy);
                })
            );
        }
    }
}
