import { TestBed } from '@angular/core/testing';
import { RideCache, RideCacheKeys } from './ride.cache';
import { StorageService, CapacitorPluginService } from '../../services';
import { HorseCache } from '../horse/horse.cache';
import { MediaCache } from '../media/media.cache';
import {
    Ride,
    RideService,
    RideStatus,
    RidePath,
    HorseIdentity,
    HorseIdentityWithGaits,
    UserIdentity,
    AppRideStatus,
    WayPoint
} from '@caballus/ui-common';
import { Location } from '@capacitor-community/background-geolocation';
import { of, timer, Subject, Observable } from 'rxjs';
import { take, filter, catchError, shareReplay } from 'rxjs/operators';

const MockStorageService = {
    getUserData: jest.fn(),
    setUserData: jest.fn(),
    clearUserData: jest.fn()
};
const MockCapacitorPluginService = {
    networkStatus: jest.fn(),
    startWatchingLocation: jest.fn(),
    stopWatchingLocation: jest.fn(),
    locationStream: jest.fn()
};
const MockRideService = {
    startRide: jest.fn(),
    endRide: jest.fn(),
    saveRideDetails: jest.fn()
};
const MockMediaCache = {
    cacheCurrentRidePhotos: jest.fn(),
    cacheCurrentRideVideos: jest.fn()
}
const MockHorseCache = {
    addFinalizedRide: jest.fn()
}

describe('RideCache', () => {
    let rideCache: RideCache;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: StorageService, useValue: MockStorageService },
                { provide: CapacitorPluginService, useValue: MockCapacitorPluginService },
                { provide: RideService, useValue: MockRideService },
                { provide: MediaCache, useValue: MockMediaCache },
                { provide: HorseCache, useValue: MockHorseCache }
            ]
        });
        rideCache = TestBed.inject(RideCache);
        jest.resetAllMocks();
    });

    it('should create', () => {
        expect(rideCache).toBeTruthy();
    });

    it('should fetch an existing ride', done => {
        const ride = new Ride();
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(ride));

        rideCache.getCurrentRide().pipe(take(1)).subscribe(r => {
            expect(ride).toStrictEqual(expect.objectContaining(ride));
            expect(MockStorageService.getUserData).toHaveBeenCalledWith(RideCacheKeys.CurrentRide);
            done();
        });
    });

    it('should start a ride if one not in progress', done => {
        MockStorageService.getUserData.mockResolvedValueOnce(null);
        MockStorageService.setUserData.mockResolvedValueOnce(undefined);
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({ connected: true }));
        MockCapacitorPluginService.startWatchingLocation.mockReturnValueOnce(of(undefined));
        MockRideService.startRide.mockReturnValueOnce(of('2'));

        const horseIdentity = new HorseIdentityWithGaits({ _id: '0', label: 'Spud', picture: null });
        const horseIdentities = [horseIdentity];
        const riderIdentity = new UserIdentity({ _id: '1', label: 'McGee', picture: null });

        rideCache.startRide(horseIdentities, riderIdentity).pipe(take(1)).subscribe(ride => {
            expect(ride).toBeTruthy();
            expect(ride.rideStatus).toBe(RideStatus.InProgress);
            expect(ride.horseIdentities).toStrictEqual(horseIdentities);
            expect(ride.riderIdentity).toStrictEqual(riderIdentity);
            expect(MockStorageService.getUserData).toHaveBeenCalledWith(RideCacheKeys.CurrentRide);
            expect(MockStorageService.setUserData).toHaveBeenCalledWith(RideCacheKeys.CurrentRide, JSON.stringify(ride));
            expect(MockRideService.startRide).toHaveBeenCalledTimes(1);
            expect(MockCapacitorPluginService.startWatchingLocation).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it('should pause the ride', done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.Riding,
            paths: [
                new RidePath({
                    startDateTime: new Date(),
                    endDateTime: null,
                    wayPoints: [
                        new WayPoint(),
                        new WayPoint()
                    ]
                })
            ]
        });

        MockCapacitorPluginService.stopWatchingLocation.mockReturnValue(of(undefined));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(ride));

        rideCache.pauseRide().pipe(take(1),).subscribe(r => {
            expect(MockStorageService.getUserData).toHaveBeenCalledTimes(1);
            expect(MockStorageService.setUserData).toHaveBeenCalledTimes(1);
            expect(r.appRideStatus).toBe(AppRideStatus.Paused);
            expect(r.paths[0].endDateTime).toBeTruthy();
            done();
        });
    });

    it('should resume the ride', done => {
        const ride = new Ride({ appRideStatus: AppRideStatus.Paused });

        MockStorageService.getUserData.mockResolvedValue(JSON.stringify(ride));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.startWatchingLocation.mockReturnValue(of(undefined));
        MockCapacitorPluginService.stopWatchingLocation.mockReturnValue(of(undefined));
        MockCapacitorPluginService.locationStream.mockReturnValue(new Subject<Location>());

        rideCache.resumeRide().pipe(
            take(1)
        ).subscribe(r => {
            expect(MockStorageService.getUserData).toHaveBeenCalledTimes(1);
            expect(MockStorageService.setUserData).toHaveBeenCalledTimes(1);
            expect(r.appRideStatus).toBe(AppRideStatus.Riding as string);
            done();
        });
    });

    it('should end the ride', done => {
        const ride = new Ride({
            appRideStatus: AppRideStatus.Paused,
            paths: [
                new RidePath({
                    startDateTime: new Date(),
                    endDateTime: null,
                    wayPoints: [
                        new WayPoint(),
                        new WayPoint()
                    ]
                })
            ]
        });

        MockStorageService.getUserData.mockResolvedValue(JSON.stringify(ride));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.stopWatchingLocation.mockReturnValue(of(undefined));
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({ connected: true }));
        MockRideService.endRide.mockReturnValueOnce(of(undefined));

        rideCache.endRide().pipe(
            take(1)
        ).subscribe(r => {
            expect(MockStorageService.getUserData).toHaveBeenCalledTimes(1);
            expect(MockStorageService.setUserData).toHaveBeenCalledTimes(1);
            expect(r.appRideStatus).toBe(AppRideStatus.EndRideDetails);
            expect(r.paths[0].endDateTime).toBeTruthy();
            expect(r.endDateTime).toBeTruthy();
            done();
        });
    });

    it('should save ride details to the cache', done => {
        /*
            saveRideDetails
                getCurrentRide
                    _storageService.getUserData (current ride)
                _storageService.setUserData
                _mediaCache.cacheCurrentRidePhotos
                _mediaCache.cacheCurrentRideVideos
                _horseCache.addFinalizedRide
                _migrateCurrentRideToUploadQueue
                    getCurrentRide
                        _storageService.getUserData (current ride)
                    _cachedUnsyncedRides
                        _storageService.getUserData (unsynced rides)
                    _storageService.setUserData
                removeCurrentRide
                    _storageService.clearUserData

        */
        const currentRide = new Ride();
        const unsyncedRides = [];
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockMediaCache.cacheCurrentRidePhotos.mockReturnValue(of(undefined));
        MockMediaCache.cacheCurrentRideVideos.mockReturnValue(of(undefined));
        MockHorseCache.addFinalizedRide.mockResolvedValue(of(undefined));
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({ connected: false }));
        MockStorageService.clearUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(currentRide))
            .mockResolvedValueOnce(JSON.stringify(currentRide))
            .mockResolvedValueOnce(JSON.stringify(unsyncedRides));

        rideCache.saveRideDetails(currentRide).pipe(take(1)).subscribe(() => {
            expect(MockStorageService.getUserData).toHaveBeenCalledTimes(3);
            expect(MockStorageService.setUserData).toHaveBeenCalledWith(RideCacheKeys.CurrentRide, JSON.stringify(currentRide));
            expect(MockStorageService.setUserData).toHaveBeenCalledTimes(2);
            expect(MockMediaCache.cacheCurrentRidePhotos).toHaveBeenCalledTimes(1);
            expect(MockMediaCache.cacheCurrentRideVideos).toHaveBeenCalledTimes(1);
            expect(MockCapacitorPluginService.networkStatus).toHaveBeenCalledTimes(1);
            expect(MockRideService.saveRideDetails).toHaveBeenCalledTimes(0);
            done();
        });
    });

    it('should upload unsynced ride details', done => {
        /*
            _uploadUnsyncedRides
                _cachedUnsyncedRides
                    _storageService.getUserData (get rides)
                _rideService.saveRideDetails (once for each ride)
        */
        const unsynced = [new Ride(), new Ride()];
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(unsynced));
        MockRideService.saveRideDetails.mockReturnValue(of(undefined));

        (rideCache['_uploadUnsyncedRides'] as () => Observable<void>)().pipe(take(1)).subscribe(() => {
            expect(MockRideService.saveRideDetails).toHaveBeenCalledTimes(unsynced.length);
            done();
        });
    });
});
