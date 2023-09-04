import { Selector, State, StateContext } from '@ngxs/store';
import { AppRideStatus, CurrentRide, HorseIdentityWithGaits, Ride, RideGaitMetrics, RidePath, RideService, UserIdentity, WayPoint } from '@caballus/ui-common';
import { Injectable, Injector } from '@angular/core';
import { produce } from '@ngxs-labs/immer-adapter';
import { EmitterAction, Receiver } from '@ngxs-labs/emitter';
import { Location } from '@capacitor-community/background-geolocation';
import { createObjectID }  from 'mongo-object-reader';
import { flatMap, getRideKilometers, getRideKilometersPerGait, getRideMinutesPerGait, RideCategory, RideEntryType, RideStatus } from '@caballus/common';
import { StorageService } from '../services/storage.service';
import moment from 'moment';
import _, { isNil } from 'lodash';
import { InitAction, LogoutAction } from './actions';
import { Network } from '@capacitor/network';
import { RideCache } from '../caches/ride/ride.cache';

const STATE_KEY = 'currentRide' as const;

interface StartRideDetails {
    horseIdentities: HorseIdentityWithGaits[],
    riderIdentity: UserIdentity
}

interface SaveRideDetails {
    manualEntry?: { duration: number, distance: number };
    category: RideCategory,
    notes: string
}

export module RideStateError {
    export class NoCurrentRide extends Error {
        constructor() {
            super('No current ride');
        }
    }

    export class CurrentRideInvalidStatus extends Error {
        constructor(
            public readonly current: AppRideStatus,
            public readonly expected?: AppRideStatus | AppRideStatus[]
        ) {
            super();

            let message = 'Ride not in correct status.';

            if (expected) {
                const currentMessage = `Found '${current}' instead`;

                let expectedMessage: string;
                if (_.isArray(expected)) {
                    const items = (expected as AppRideStatus[]).map(status => `\t'${status}'`).join(',\n');
                    expectedMessage = `Expected ride status to be one of:\n${items}`;
                } else {
                    expectedMessage = `Expected ride status to be ${expected}`;
                }

                message = `${message} ${expectedMessage}\n${currentMessage}`;
            } else {
                message = `${message} Currently '${current}'`;
            }

            this.message = message;
        }
    }
}

// NOTE: null has issues with the ImmutableContext and ImmutableSelector
// decorators. This setup is going to require that you use the old "produce"
// overload instead.
type RideStateModel = CurrentRide | null;

/**
 * The current ride (or not), will be populated with the active ride if there is
 * one. Otherwise it will be populated with undefined.
 */
@State<RideStateModel>({
    name: STATE_KEY,
    defaults: null
})
@Injectable({ providedIn: 'root' })
export class RideState {
    private static _storageService: StorageService;
    private static _rideService: RideService;
    private static _rideCache: RideCache;

    constructor(injector: Injector) {
        RideState._storageService = injector.get(StorageService);
        RideState._rideService = injector.get(RideService);
        RideState._rideCache = injector.get(RideCache);
    }

    @Receiver({ action: InitAction })
    public static async init(context: StateContext<RideStateModel>): Promise<void> {
        const saveState = await RideState._storageService.getUserData<object>(STATE_KEY);
        if (!saveState) {
            return;
        }

        context.setState(new Ride(saveState));
    }

    @Selector()
    public static wayPoints(ride: RideStateModel): WayPoint[] | null {
        if (!ride) {
            return null;
        }

        return flatMap(ride.paths, path => path.wayPoints);
    }

    @Receiver()
    public static async addWayPoint(
        context: StateContext<RideStateModel>,
        { payload }: EmitterAction<Location>
    ): Promise<void> {
        const wayPoint = new WayPoint({
            timestamp: new Date(payload.time),
            latitude: payload.latitude,
            longitude: payload.longitude,
            altitude: payload.altitude
        });

        const newState = produce(context, (ride: RideStateModel) => {
            if (!ride) {
                // TODO enumerated error type
                throw new RideStateError.NoCurrentRide();
            }

            if (ride.appRideStatus !== AppRideStatus.Riding) {
                throw new RideStateError.CurrentRideInvalidStatus(ride.appRideStatus, AppRideStatus.Riding);
            }

            // Paths are "completed" when the ride is paused, if the last path
            // is completed then start a new path now
            let lastPath = ride.paths[ride.paths.length - 1];
            if (!lastPath || lastPath.endDateTime) {
                lastPath = new RidePath({
                    startDateTime: new Date(),
                    endDateTime: null,
                    wayPoints: []
                });

                ride.paths.push(lastPath);
            }

            lastPath.wayPoints.push(wayPoint);
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        return RideState._storageService.setUserData(STATE_KEY, newRide);
    }

    @Receiver()
    public static async startRide(
        context: StateContext<RideStateModel>,
        { payload }: EmitterAction<StartRideDetails>
    ): Promise<void> {
        const newRide = new Ride({
            _id: createObjectID(),
            appRideStatus: AppRideStatus.Riding,
            startDateTime: new Date(),
            horseIdentities: payload.horseIdentities,
            riderIdentity: payload.riderIdentity
        });

        let newState = produce(context, (ride: RideStateModel) => {
            if (ride) {
                throw new RideStateError.CurrentRideInvalidStatus(ride.appRideStatus);
            }

            // Replace state with the new ride
            return newRide;
        });

        // TODO start watching location service for updates to waypoints?
        //   ...or should that responsibility be relegated to the caller?
        //
        //   -- Need to make sure to handle app reload situation where an
        //   existing ride is restored from storage and this event *doesn't*
        //   get fired because the ride was already started.

        const networkStatus = await Network.getStatus();
        if (networkStatus.connected) {
            const startRideDto = {
                _id: newRide._id,
                horseIds: newRide.horseIdentities.map(identity => identity._id),
                startDateTime: newRide.startDateTime
            };

            await RideState._rideService.startRide(startRideDto).toPromise();
            newState = produce(context, (ride: RideStateModel) => {
                ride.rideStatus = RideStatus.InProgress;
            });
        }

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRideState = newState[STATE_KEY];
        return RideState._storageService.setUserData(STATE_KEY, newRideState);
    }

    @Receiver()
    public static async pauseRide(context: StateContext<RideStateModel>): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (!ride) {
                throw new RideStateError.NoCurrentRide();
            }

            switch (ride.appRideStatus) {
                case AppRideStatus.Riding:
                    ride.appRideStatus = AppRideStatus.Paused;

                    // Complete the current path, a new path will be created
                    // when/if the next waypoint is added
                    let lastPath = ride.paths[ride.paths.length - 1];
                    if (lastPath) {
                        lastPath.endDateTime = new Date();
                    }
                    break;
                case AppRideStatus.Paused:
                    // No-Op
                    break;
                case AppRideStatus.EndRideDetails:
                case AppRideStatus.Finalized:
                default:
                    throw new RideStateError.CurrentRideInvalidStatus(
                        ride.appRideStatus,
                        AppRideStatus.Riding
                    );
            }
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        return RideState._storageService.setUserData(STATE_KEY, newRide);
    }

    @Receiver()
    public static async resumeRide(context: StateContext<RideStateModel>): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (!ride) {
                throw new RideStateError.NoCurrentRide();
            }

            switch (ride.appRideStatus) {
                case AppRideStatus.Paused:
                    ride.appRideStatus = AppRideStatus.Riding;
                    break;
                case AppRideStatus.Riding:
                    // No-Op
                    break;
                case AppRideStatus.EndRideDetails:
                case AppRideStatus.Finalized:
                default:
                    throw new RideStateError.CurrentRideInvalidStatus(
                        ride.appRideStatus,
                        AppRideStatus.Paused
                    );
            }
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        return RideState._storageService.setUserData(STATE_KEY, newRide);
    }

    @Receiver()
    public static async endRide(context: StateContext<RideStateModel>): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (!ride) {
                throw new RideStateError.NoCurrentRide();
            }

            switch (ride.appRideStatus) {
                case AppRideStatus.Finalized:
                    throw new RideStateError.CurrentRideInvalidStatus(ride.appRideStatus, [
                        AppRideStatus.Riding,
                        AppRideStatus.Paused
                    ]);
                case AppRideStatus.EndRideDetails:
                    // No-Op
                    return;
                default:
            }

            ride.appRideStatus = AppRideStatus.EndRideDetails;
            ride.endDateTime = new Date();

            // Complete the current path if not already completed (paused)
            const lastPath = ride.paths[ride.paths.length - 1];
            if (lastPath && !lastPath.endDateTime) {
                lastPath.endDateTime = ride.endDateTime;
            }

            ride.entryType = RideEntryType.RealTime;
            ride.distanceKilometers = getRideKilometers(ride);
            for (const horse of ride.horseIdentities) {
                const gaitMetricsMinutes = new RideGaitMetrics({
                    horseId: horse._id,
                    metrics: getRideMinutesPerGait(ride, horse.gaitsKilometersPerHourSnapshot)
                });
                ride.calculatedGaitMinutes.push(gaitMetricsMinutes);

                const gaitMetricsKilometers = new RideGaitMetrics({
                    horseId: horse._id,
                    metrics: getRideKilometersPerGait(ride, horse.gaitsKilometersPerHourSnapshot)
                });
                ride.calculatedGaitKilometers.push(gaitMetricsKilometers);
            }
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY] as RideStateModel;
        await RideState._storageService.setUserData(STATE_KEY, newRide);

        // Send to server if network is up
        const networkStatus = await Network.getStatus();
        if (!networkStatus.connected) {
            return;
        }

        const endRideDto = {
            _id: newRide._id,
            startDateTime: newRide.startDateTime,
            endDateTime: newRide.endDateTime,
            horseIds: newRide.horseIdentities.map(identity => identity._id)
        };
        await RideState._rideService.endRide(endRideDto).toPromise();
        const updatedState = produce(context, (ride: RideStateModel) => {
            if (ride.rideStatus === RideStatus.InProgress) {
                ride.rideStatus = RideStatus.Complete;
            }
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const updatedRide = updatedState[STATE_KEY];
        await RideState._storageService.setUserData(STATE_KEY, updatedRide);
    }

    @Receiver()
    public static async manualDuration(
        context: StateContext<RideStateModel>,
        { payload }: EmitterAction<number>
    ): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (ride.appRideStatus !== AppRideStatus.EndRideDetails) {
                throw new RideStateError.CurrentRideInvalidStatus(
                    ride.appRideStatus,
                    AppRideStatus.EndRideDetails
                );
            }

            ride.entryType = RideEntryType.Manual;
            ride.endDateTime = moment(ride.startDateTime)
                .add(payload, 'milliseconds')
                .toDate();
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        return RideState._storageService.setUserData(STATE_KEY, newRide);
    }

    @Receiver()
    public static async manualDistance(
        context: StateContext<RideStateModel>,
        { payload }: EmitterAction<number>
    ): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (ride.appRideStatus !== AppRideStatus.EndRideDetails) {
                throw new RideStateError.CurrentRideInvalidStatus(
                    ride.appRideStatus,
                    AppRideStatus.EndRideDetails
                );
            }

            ride.entryType = RideEntryType.Manual;
            ride.distanceKilometers = payload;
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        return RideState._storageService.setUserData(STATE_KEY, newRide);
    }

    @Receiver()
    public static async saveRide(
        context: StateContext<RideStateModel>,
        { payload }: EmitterAction<SaveRideDetails>
    ): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (payload.manualEntry) {
                ride.entryType = RideEntryType.Manual;

                const { duration, distance } = payload.manualEntry;
                if (!isNil(duration)) {
                    ride.endDateTime = moment(ride.startDateTime)
                        .add(duration, 'milliseconds')
                        .toDate();
                }

                if (!isNil(distance)) {
                    ride.distanceKilometers = distance;
                }
            }

            ride.category = payload.category;
            ride.notes = payload.notes;
            ride.appRideStatus = AppRideStatus.Finalized;
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        await RideState._storageService.setUserData(STATE_KEY, newRide);
        await RideState._rideCache.saveRideDetails(newRide).toPromise();
    }

    @Receiver()
    public static async cancel(context: StateContext<RideStateModel>): Promise<void> {
        produce(context, (ride: RideStateModel) => {
            if (isNil(ride)) {
                // Cannot cancel a ride that doesn't exist
                throw new RideStateError.NoCurrentRide();
            }

            if (ride.appRideStatus === AppRideStatus.Finalized) {
                // Do not cancel finalized rides, use the "clear" action
                // instead
                throw new RideStateError.CurrentRideInvalidStatus(ride.appRideStatus, [
                    AppRideStatus.Paused,
                    AppRideStatus.Riding,
                    AppRideStatus.EndRideDetails
                ]);
            }

            return null;
        });

        await RideState._storageService.clearUserData(STATE_KEY);

        // TODO send to server if network is up
        // await RideState._rideService.cancelRide(rideId?);
    }

    @Receiver()
    public static async clear(context: StateContext<RideStateModel>): Promise<void> {
        produce(context, (ride: RideStateModel) => {
            if (isNil(ride)) {
                // Cannot delete a ride that doesn't exist
                throw new RideStateError.NoCurrentRide();
            }

            if (ride.appRideStatus !== AppRideStatus.Finalized) {
                // TODO enumerated error type
                //
                // Do not delete in progress rides, use the "cancel" action
                // instead so that the server is notified
                throw new RideStateError.CurrentRideInvalidStatus(
                    ride.appRideStatus,
                    AppRideStatus.Finalized
                );
            }

            return null;
        });

        await RideState._storageService.clearUserData(STATE_KEY);
    }

    // Unconditionally wipe the ride state on logout
    @Receiver({ action: LogoutAction })
    public static async cleanUp({ setState }: StateContext<RideStateModel>): Promise<void> {
        setState(null);
        await RideState._storageService.clearUserData(STATE_KEY);
    }

    @Receiver()
    public static async didShowGpsWarning(context: StateContext<RideStateModel>): Promise<void> {
        const newState = produce(context, (ride: RideStateModel) => {
            if (!ride) {
                throw new RideStateError.NoCurrentRide();
            }

            ride.didShowGpsWarning = true;
        });

        // produce overload is bugged and returns the entire state intead of
        // just the ride state
        const newRide = newState[STATE_KEY];
        await RideState._storageService.setUserData(STATE_KEY, newRide);
    }

    // Upload queue is the responsibility of ride service or something
    // Maybe ngxs can be used for a state machine in there
}

export namespace RideState {
    export const Key = STATE_KEY;
}
