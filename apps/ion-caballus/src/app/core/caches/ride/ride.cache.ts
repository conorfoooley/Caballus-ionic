import { Injectable } from '@angular/core';
import { AppRideStatus, Ride, RideService, RideStatus } from '@caballus/ui-common';
import { StorageService } from '../../services/storage.service';
import { CapacitorPluginService } from '../../services/capacitor-plugin.service';
import { HorseCache } from '../horse/horse.cache';
import { concat, defer, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, defaultIfEmpty, map, mapTo, share, switchMap, tap } from 'rxjs/operators';
import { MediaCache } from '../media/media.cache';

enum Keys {
    UnsyncedRides = 'unsynced-rides-',
    CurrentRide = 'current-ride-',
    UploadingMedias = 'uploading-medias-'
}

export { Keys as RideCacheKeys };

@Injectable({ providedIn: 'root' })
export class RideCache {
    private _currentUnsyncedChangesUpload$: Observable<void> = null;

    constructor(
        private readonly _storageService: StorageService,
        private readonly _capacitorPluginService: CapacitorPluginService,
        private readonly _rideService: RideService,
        private readonly _horseCache: HorseCache,
        private readonly _mediaCache: MediaCache
    ) {}

    public sync(): Observable<void> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    !network.connected ? of(undefined) : this._uploadUnsyncedChanges()
                )
            );
    }

    private _uploadUnsyncedChangesIfConnected(): Observable<void> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(status =>
                    status.connected ? this._uploadUnsyncedChanges() : of(undefined)
                )
            );
    }

    private _uploadUnsyncedChanges(): Observable<void> {
        return this._cachedUnsyncedRides().pipe(
            switchMap(unsynced => {
                if (!unsynced.length || !this._currentUnsyncedChangesUpload$) {
                    this._currentUnsyncedChangesUpload$ = this._uploadUnsyncedRides().pipe(
                        switchMap(() =>
                            from(this._storageService.clearUserData(Keys.UnsyncedRides))
                        ),
                        tap(() => (this._currentUnsyncedChangesUpload$ = null)),
                        share()
                    );
                }

                return this._currentUnsyncedChangesUpload$;
            }),
            catchError(e => {
                console.log(e);
                return of(e);
            })
        );
    }

    public saveRideDetails(rideWithDetails: Ride): Observable<void> {
        if (rideWithDetails.appRideStatus !== AppRideStatus.Finalized) {
            // TODO enumerated error type?
            throw new Error('Ride must be finalized to save');
        }

        return concat(
            this._horseCache.addFinalizedRide(rideWithDetails),
            this._addRideToUploadQueue(rideWithDetails),
            this._mediaCache.migrateCurrentRideMediaToUploadQueue(),
            this._uploadUnsyncedChangesIfConnected()
        );
    }

    private _addRideToUploadQueue(ride: Ride): Observable<void> {
        return this._cachedUnsyncedRides().pipe(
            map(unsynced => [...unsynced, ride]),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedRides,
                        JSON.stringify(allUnsynced)
                    )
                )
            )
        );
    }

    private _uploadUnsyncedRides(): Observable<void> {
        return this._cachedUnsyncedRides().pipe(
            map(rides =>
                rides.map(r => {
                    // verify the rideStatus is undefined or not
                    // If it's undefined then it's means ride is still in the cache, not yet synced
                    if (!r.rideStatus) {
                        return from(
                            // start ride
                            this._rideService
                                .startRide({
                                    _id: r._id,
                                    startDateTime: r.startDateTime,
                                    horseIds: r.horseIdentities.map(h => h._id)
                                })
                                .pipe(
                                    // update ride
                                    switchMap(() =>
                                        this._rideService.endRide({
                                            _id: r._id,
                                            startDateTime: r.startDateTime,
                                            endDateTime: r.endDateTime,
                                            horseIds: r.horseIdentities.map(h => h._id)
                                        })
                                    ),
                                    // finalize ride
                                    switchMap(() => this._rideService.saveRideDetails(r))
                                )
                        );
                    } else if (r.rideStatus === RideStatus.InProgress) {
                        // verify the rideStatus is InProgress, then ride progress is not yet synced
                        // try to end the ride first and then finalize it by updating the ride details on server
                        return from(
                            this._rideService.endRide({
                                _id: r._id,
                                startDateTime: r.startDateTime,
                                endDateTime: r.endDateTime,
                                horseIds: r.horseIdentities.map(h => h._id)
                            })
                        ).pipe(switchMap(() => this._rideService.saveRideDetails(r)));
                    }

                    return this._rideService.saveRideDetails(r);
                })
            ),
            switchMap(observables =>
                forkJoin(observables).pipe(defaultIfEmpty(undefined), mapTo(undefined))
            ),
            catchError(e => {
                console.log(e);
                return of(undefined);
            })
        );
    }

    private _parseRides(json: string): Ride[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => new Ride(e)) : [];
    }

    private _cachedUnsyncedRides(): Observable<Ride[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedRides)).pipe(
            map(json => {
                return this._parseRides(json);
            }),
            catchError(e => {
                console.log(e);
                return of(e);
            })
        );
    }

    public getAllUploadingMedias(): Observable<any> {
        return from(this._storageService.getUserData(Keys.UploadingMedias));
    }

    public skipUploadingMedia(uuid: string): Observable<any> {
        return from(this._storageService.getUserData(Keys.UploadingMedias));
    }

    public completeUploadingMedia(uuid: string): Observable<any> {
        return from(this._storageService.getUserData(Keys.UploadingMedias));
    }
}
