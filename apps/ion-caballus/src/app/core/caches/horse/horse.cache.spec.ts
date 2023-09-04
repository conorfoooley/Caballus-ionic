import {TestBed} from '@angular/core/testing';
import {
    HorseCache,
    HorseCacheKeys,
    HorseRelationshipsSimpleWithId,
    HorseStatTotalsWithId
} from './horse.cache';
import {
    Gait,
    GaitNumbers,
    Horse,
    HorseBioDto,
    HorseDetails,
    HorseForRide,
    HorseGaitsDto,
    HorseIdentityWithGaits,
    HorsePrivacyDto,
    HorseProfile,
    HorseProfilePrivacy,
    HorseProfileStatus,
    HorseRelationshipsSimple,
    HorseService,
    HorseStatTotals,
    Privacy,
    Ride,
    RideEntryType,
    RideGaitMetrics,
    User,
    UserIdentity,
    UserProfile
} from '@caballus/ui-common';
import {CapacitorPluginService, StorageService} from '../../services';
import {forkJoin, Observable, of} from 'rxjs';
import {take} from 'rxjs/operators';
import {NgxsModule, Store} from '@ngxs/store';

const MockHorseService = {
    createHorses: jest.fn(),
    getHorsesForRide: jest.fn(),
    getViewableHorses: jest.fn(),
    getHorseRelationships: jest.fn(),
    getHorseStatTotals: jest.fn(),
    editHorseBio: jest.fn(),
    toggleHorseProfileStatus: jest.fn()
};
const MockStorageService = {
    getUserData: jest.fn(),
    setUserData: jest.fn(),
    clearUserData: jest.fn()
};
const MockCapacitorPluginService = {
    networkStatus: jest.fn()
};
const MockStore = {
    select: jest.fn(),
    selectSnapshot: jest.fn()
};

describe('HorseCache', () => {
    let horseCache: HorseCache;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([])],
            providers: [
                {provide: HorseService, useValue: MockHorseService},
                {provide: StorageService, useValue: MockStorageService},
                {provide: CapacitorPluginService, useValue: MockCapacitorPluginService},
                {provide: Store, useValue: MockStore}
            ]
        });
        horseCache = TestBed.get(HorseCache);
        jest.resetAllMocks();
    });

    it('should create', () => {
        expect(horseCache).toBeTruthy();
    });

    it('should multicast the sync operation', done => {
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: true}));
        MockHorseService.getHorsesForRide.mockReturnValue(of([]));
        MockHorseService.createHorses.mockReturnValue(of([]));
        MockHorseService.getViewableHorses.mockReturnValue(of([]));
        MockHorseService.getHorseRelationships.mockReturnValue(of(null));
        MockHorseService.getHorseStatTotals.mockReturnValue(of(null));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData.mockResolvedValue(JSON.stringify([]));
        MockStorageService.clearUserData.mockResolvedValue(undefined);
        /*
            Generate 5 subscriptions but expect interior helper
            functions to be called the number of times corresponding
            to only 1 subscription (with no horses to upload)
        */
        forkJoin([
            horseCache.sync(),
            horseCache.sync(),
            horseCache.sync(),
            horseCache.sync(),
            horseCache.sync()
        ])
            .pipe(take(1))
            .subscribe(() => {
                expect(MockHorseService.getHorsesForRide).toHaveBeenCalledTimes(1);
                expect(MockHorseService.getViewableHorses).toHaveBeenCalledTimes(2);
                /*
                getHorseRelationships and getHorseStatTotals expect zero
                because mock value of viewable horses is an empty array
            */
                expect(MockHorseService.getHorseRelationships).toHaveBeenCalledTimes(0);
                expect(MockHorseService.getHorseStatTotals).toHaveBeenCalledTimes(0);
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(5);
                expect(MockHorseService.createHorses).toHaveBeenCalledTimes(0);
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(5);
                expect(MockStorageService.clearUserData).toHaveBeenCalledTimes(5);
                done();
            });
    });

    it('should deliver cache entries from getHorsesForRide() when offline', done => {
        const horses = [
            new HorseForRide({commonName: 'A'}),
            new HorseForRide({commonName: 'B'})
        ];
        const unsyncedHorses = [new Horse({profile: new HorseProfile({commonName: 'C'})})];
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(horses))
            .mockResolvedValueOnce(JSON.stringify(unsyncedHorses));
        horseCache
            .getHorsesForRide()
            .pipe(take(1))
            .subscribe(horses => {
                const names = horses.map(h => h.commonName);
                expect(names).toEqual(expect.arrayContaining(['A', 'B', 'C']));
                expect(MockStorageService.getUserData).toHaveBeenCalledWith(
                    HorseCacheKeys.HorsesForRide
                );
                expect(MockHorseService.getHorsesForRide).toHaveBeenCalledTimes(0);
                done();
            });
    });

    it('should download and return fresh cache entries for getHorsesForRide() when online', done => {
        const horses = [
            new HorseForRide({commonName: 'A'}),
            new HorseForRide({commonName: 'B'})
        ];
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: true}));
        MockStorageService.setUserData.mockResolvedValueOnce(undefined);
        MockHorseService.getHorsesForRide.mockReturnValueOnce(of(horses));
        horseCache
            .getHorsesForRide()
            .pipe(take(1))
            .subscribe(horses => {
                const names = horses.map(h => h.commonName);
                expect(names).toEqual(expect.arrayContaining(['A', 'B']));
                expect(MockHorseService.getHorsesForRide).toHaveBeenCalledTimes(1);
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(0);
                done();
            });
    });

    it('should store a quick-add horse in the cache', done => {
        /*
            quickAddHorseForRide
                _cachedUnsyncedHorsesToCreate
                    _storageService.getUserData
                _storageService.setUserData
                _uploadUnsyncedChangesIfConnected
                getHorsesForRide
                    _storageService.getUserData
        */
        const existingForRide = new HorseForRide({commonName: 'existing'});
        const quickAdd = new HorseForRide({commonName: 'quickie'});
        const quickAddAsUnsynced = new Horse({
            profile: new HorseProfile({
                commonName: 'quickie',
                profileStatus: HorseProfileStatus.Active
            }),
            gaitsKilometersPerHour: Gait.defaultKilometersPerHour()
        });
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify([]))
            .mockResolvedValueOnce(JSON.stringify([existingForRide]))
            .mockResolvedValueOnce(JSON.stringify([quickAddAsUnsynced]));
        horseCache
            .quickAddHorseForRide(quickAdd)
            .pipe(take(1))
            .subscribe((v: { horses: HorseForRide[]; newId: string }) => {
                expect(v.newId).toBeTruthy();
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(1);
                expect(MockHorseService.createHorses).toHaveBeenCalledTimes(0);
                done();
            });
    });

    it('should deliver cache entries from getHorsesForList() when offline', done => {
        /*
            getHorsesForList
                cap.networkStatus
                _cachedHorsesForList
                    storage.getUserData (HorsesForList)
                    _cachedUnsyncedHorses
                        storage.getUserData (UnsyncedHorses)
        */
        const existingForList = new HorseDetails({
            profile: new HorseProfile({commonName: 'A'})
        });
        const unsynced = new Horse({profile: new HorseProfile({commonName: 'B'})});
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify([existingForList]))
            .mockResolvedValueOnce(JSON.stringify([unsynced]));
        horseCache
            .getHorsesForList()
            .pipe(take(1))
            .subscribe(forList => {
                expect(MockHorseService.getViewableHorses).toHaveBeenCalledTimes(0);
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(2);
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(0);
                expect(Array.isArray(forList)).toBe(true);
                expect(forList.length).toBe(2);
                done();
            });
    });

    it('should refresh cache and deliver new entries from getHorsesForList() when online', done => {
        /*
            getHorsesForList
                cap.networkStatus
                _syncHorsesForListCache
                    _downloadHorsesForList
                        horseService.getViewableHorses
                        storage.setUserData
        */
        const viewable = [
            new HorseDetails({profile: new HorseProfile({commonName: 'A'})}),
            new HorseDetails({profile: new HorseProfile({commonName: 'B'})})
        ];
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({connected: true}));
        MockHorseService.getViewableHorses.mockReturnValueOnce(of(viewable));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        horseCache
            .getHorsesForList()
            .pipe(take(1))
            .subscribe(forList => {
                expect(MockHorseService.getViewableHorses).toHaveBeenCalledTimes(1);
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(0);
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(1);
                expect(Array.isArray(forList)).toBe(true);
                expect(forList.length).toBe(2);
                done();
            });
    });

    it('shoud create a horse in the cache', done => {
        /*
            createHorse
                _cachedUnsyncedHorsesToCreate
                    _storageService.getUserData
                _storageService.setUserData
        */
        const create = new Horse({profile: new HorseProfile({commonName: 'A'})});
        const unsynced = new Horse({profile: new HorseProfile({commonName: 'B'})});
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify([unsynced]));
        horseCache
            .createHorse(create)
            .pipe(take(1))
            .subscribe(() => {
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(1);
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(1);
                expect(MockHorseService.createHorses).toHaveBeenCalledTimes(0);
                expect(MockStorageService.clearUserData).toHaveBeenCalledTimes(0);
                done();
            });
    });

    it('should upload new horses from the cache', done => {
        /*
            _uploadUnsyncedHorsesToCreate
                _cachedUnsyncedHorsesToCreate
                    _storageService.getUserData (get to create)
                _horseService.createHorses
        */
        const toCreate = [
            new Horse({_id: '0', profile: new HorseProfile({commonName: 'A'})}),
            new Horse({_id: '1', profile: new HorseProfile({commonName: 'B'})})
        ];
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(toCreate));
        MockHorseService.createHorses.mockReturnValueOnce(of(['0', '1']));
        (horseCache['_uploadUnsyncedHorsesToCreate'] as () => Observable<void>)()
            .pipe(take(1))
            .subscribe(() => {
                const sent = MockHorseService.createHorses.mock.calls[0][0];
                expect(sent.horses[0]).toMatchObject(toCreate[0]);
                expect(sent.horses[1]).toMatchObject(toCreate[1]);
                done();
            });
    });

    it('should deliver cache entries for getHorseRelationships() when offline', done => {
        /*
            _getHorseRelationships
                _cachedHorseRelationships
                    _storageService.getUserData
                    _parseHorseRelationships
        */
        const relationship: HorseRelationshipsSimpleWithId = {
            ...new HorseRelationshipsSimple(),
            _id: '0'
        };
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({connected: false}));
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify([relationship]));
        horseCache
            .getHorseRelationships('0')
            .pipe(take(1))
            .subscribe(r => {
                expect(MockCapacitorPluginService.networkStatus).toHaveBeenCalledTimes(1);
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(1);
                expect(r).toBeTruthy();
                done();
            });
    });

    it('should download entries for getHorseRelationships when online', done => {
        /*
            getHorseRelationships
                _getHorsesRelationships
                    _capacitorPluginService.networkStatus
                    _syncHorsesRelationshipsCache
                        _downloadHorseRelationships
                            _horseService.getHorsesForList
                                _capacitorPluginService.networkStatus
                                _syncHorsesForListCache
                                    _downloadHorsesForList
                                        _horseService.getViewableHorses
                                        _storageService.setUserData
                            _horseService.getHorseRelationships
                            _storageService.setUserData
        */
        const forList = [new HorseDetails({_id: '0'})];
        const relationship: HorseRelationshipsSimpleWithId = {
            ...new HorseRelationshipsSimple(),
            _id: '0'
        };
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: true}));
        MockStorageService.setUserData.mockResolvedValue(undefined);

        MockHorseService.getViewableHorses.mockReturnValueOnce(of(forList));
        MockHorseService.getHorseRelationships.mockReturnValueOnce(of(relationship));
        horseCache
            .getHorseRelationships('0')
            .pipe(take(1))
            .subscribe(r => {
                expect(MockCapacitorPluginService.networkStatus).toHaveBeenCalledTimes(2);
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(2);
                expect(MockHorseService.getViewableHorses).toHaveBeenCalledTimes(1);
                expect(MockHorseService.getHorseRelationships).toHaveBeenCalledTimes(1);
                expect(r).toBeTruthy();
                done();
            });
    });

    it('should deliver cache entries for stat totals when offline', done => {
        /*
            getHorseStatTotals
                _getHorsesStatTotals
                    _capacitorPluginService.networkStatus
                    _cachedHorsesStatTotals
                        _storageService.getUserData
        */
        const totals: HorseStatTotalsWithId = {
            ...new HorseStatTotals(),
            _id: '0'
        };
        MockCapacitorPluginService.networkStatus.mockReturnValueOnce(of({connected: false}));
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(totals));
        horseCache
            .getHorseStatTotals('0')
            .pipe(take(1))
            .subscribe(t => {
                expect(MockCapacitorPluginService.networkStatus).toHaveBeenCalledTimes(1);
                expect(MockStorageService.getUserData).toHaveBeenCalledTimes(1);
                expect(t).toBeTruthy();
                done();
            });
    });

    it('should download entries for getStatTotals when online', done => {
        /*
            getHorseStatTotals
                _getHorseStatTotals
                    _capacitorPluginService.networkStatus
                    _syncHorsesStatTotalsCache
                        _downloadHorsesStatTotals
                            getHorsesForList
                                _capacitorPluginService.networkStatus
                                _syncHorsesForListCache
                                    _downloadHorsesForList
                                        _horseService.getViewableHorses
                                        _storageService.setUserData
                            _horseService.getHorseStatTotals
                            _storageService.setUserData
        */
        const forList = [new HorseDetails({_id: '0'})];
        const totals: HorseStatTotalsWithId = {
            ...new HorseStatTotals(),
            _id: '0'
        };
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: true}));
        MockStorageService.setUserData.mockResolvedValue(undefined);

        MockHorseService.getViewableHorses.mockReturnValueOnce(of(forList));
        MockHorseService.getHorseStatTotals.mockReturnValueOnce(of(totals));
        horseCache
            .getHorseStatTotals('0')
            .pipe(take(1))
            .subscribe(t => {
                expect(MockCapacitorPluginService.networkStatus).toHaveBeenCalledTimes(2);
                expect(MockStorageService.setUserData).toHaveBeenCalledTimes(2);
                expect(MockHorseService.getViewableHorses).toHaveBeenCalledTimes(1);
                expect(MockHorseService.getHorseStatTotals).toHaveBeenCalledTimes(1);
                expect(t).toBeTruthy();
                done();
            });
    });

    it('should apply a horse bio edit to local data and set aside deltas for upload', done => {
        /*
            editHorseBio
                _cachedUnsyncedHorsesBioEdits
                        _storageService.getUserData (get bio edits)
                    _storageService.setUserData (set bio edits)
                    _editHorsesToCreate
                        _cachedUnsyncedHorsesToCreate
                            _storageService.getUserData (get to create)
                        _storageService.setUserData (set to create)
                    _editHorseForList
                        _cachedHorsesForList
                            _storageService.getUserData (get for list)
                        _storageService.setUserData (set for list)
                    _editHorseForRide
                        _cachedHorsesForRide
                            _storageService.getUserData (get for ride)
                        _storageService.setUserData (set for ride)
        */
        const existingEdits: HorseBioDto[] = [];
        const toCreate: Horse[] = [];
        const forList = [
            new HorseDetails({_id: '0', profile: new HorseProfile({commonName: 'A'})})
        ];
        const forRide = [new HorseForRide({_id: '0', commonName: 'A'})];
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(existingEdits))
            .mockResolvedValueOnce(JSON.stringify(toCreate))
            .mockResolvedValueOnce(JSON.stringify(forList))
            .mockResolvedValueOnce(JSON.stringify(forRide));
        horseCache
            .editHorseBio('0', new HorseProfile({commonName: 'B'}))
            .pipe(take(1))
            .subscribe(() => {
                const storedBioEdits = JSON.parse(MockStorageService.setUserData.mock.calls[0][1]);
                const storedForList = JSON.parse(MockStorageService.setUserData.mock.calls[1][1]);
                const storedForRide = JSON.parse(MockStorageService.setUserData.mock.calls[2][1]);
                expect(storedBioEdits[0]).toMatchObject({commonName: 'B'});
                expect(storedForList[0]).toMatchObject({profile: {commonName: 'B'}});
                expect(storedForRide[0]).toMatchObject({commonName: 'B'});
                done();
            });
    });

    it('should apply a horse gait edit to local data and set aside deltas for upload', done => {
        /*
            editHorseGaits
                _cachedUnsyncedHorseGaitsEdits
                    _storageService.getUserData (get gait edits)
                _storageService.setUserData (set gait edits)
                    _editHorsesToCreate
                        _cachedUnsyncedHorsesToCreate
                            _storageService.getUserData (get to create)
                        _storageService.setUserData (set to create)
                    _editHorseForList
                        _cachedHorsesForList
                            _storageService.getUserData (get for list)
                        _storageService.setUserData (set for list)
                    _editHorseForRide
                        _cachedHorsesForRide
                            _storageService.getUserData (get for ride)
                        _storageService.setUserData (set for ride)
        */
        const gaitsKilometersPerHour: GaitNumbers = {
            [Gait.None]: 0,
            [Gait.Walk]: 1,
            [Gait.Trot]: 3,
            [Gait.Lope]: 5,
            [Gait.Gallop]: 7
        };
        const gaitsUpdate: GaitNumbers = {
            [Gait.None]: 0,
            [Gait.Walk]: 2,
            [Gait.Trot]: 4,
            [Gait.Lope]: 6,
            [Gait.Gallop]: 8
        };
        const existingEdits: HorseGaitsDto[] = [];
        const toCreate: Horse[] = [];
        const forList = [new HorseDetails({_id: '0', gaitsKilometersPerHour})];
        const forRide = [new HorseForRide({_id: '0', gaitsKilometersPerHour})];
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(existingEdits))
            .mockResolvedValueOnce(JSON.stringify(toCreate))
            .mockResolvedValueOnce(JSON.stringify(forList))
            .mockResolvedValueOnce(JSON.stringify(forRide));
        horseCache
            .editHorseGaits('0', gaitsUpdate)
            .pipe(take(1))
            .subscribe(() => {
                const storedEdits = JSON.parse(MockStorageService.setUserData.mock.calls[0][1]);
                const storedForList = JSON.parse(MockStorageService.setUserData.mock.calls[1][1]);
                const storedForRide = JSON.parse(MockStorageService.setUserData.mock.calls[2][1]);
                expect(storedEdits).toHaveLength(1);
                expect(storedEdits[0]).toMatchObject({
                    id: '0',
                    gaitsKilometersPerHour: gaitsUpdate
                });
                expect(storedForList[0]).toMatchObject({gaitsKilometersPerHour: gaitsUpdate});
                expect(storedForRide[0]).toMatchObject({gaitsKilometersPerHour: gaitsUpdate});
                done();
            });
    });

    it('should apply a horse profile status toggle to local data and set aside for upload', done => {
        /*
            toggleHorseProfileStatus
                _cachedUnsyncedHorsesProfileStatusToggles
                    _storageService.getUserData (get toggles)
                _storageService.setUserData (set toggles)
                    _editHorsesToCreate
                        _cachedUnsyncedHorsesToCreate
                            _storageService.getUserData (get to create)
                        _storageService.setUserData (set to create)
                    _editHorseForList
                        _cachedHorsesForList
                            _storageService.getUserData (get for list)
                        _storageService.setUserData (set for list)
                    _editHorseForRide
                        _cachedHorsesForRide
                            _storageService.getUserData (get for ride)
                        _storageService.setUserData (set for ride)
        */
        const existingToggles: string[] = [];
        const toCreate: Horse[] = [];
        const forList = [
            new HorseDetails({
                _id: '0',
                profile: new HorseProfile({profileStatus: HorseProfileStatus.Active})
            })
        ];
        const forRide = [new HorseForRide({_id: '0', profileStatus: HorseProfileStatus.Active})];
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(existingToggles))
            .mockResolvedValueOnce(JSON.stringify(toCreate))
            .mockResolvedValueOnce(JSON.stringify(forList))
            .mockResolvedValueOnce(JSON.stringify(forRide));
        horseCache
            .toggleHorseProfileStatus('0', HorseProfileStatus.Active)
            .pipe(take(1))
            .subscribe(() => {
                const storedToggles = JSON.parse(MockStorageService.setUserData.mock.calls[0][1]);
                const storedForList = JSON.parse(MockStorageService.setUserData.mock.calls[1][1]);
                const storedForRide = JSON.parse(MockStorageService.setUserData.mock.calls[2][1]);
                expect(storedToggles[0]).toBe('0');
                expect(storedForList[0]).toMatchObject({
                    profile: {profileStatus: HorseProfileStatus.Disabled}
                });
                expect(storedForRide[0]).toMatchObject({
                    profileStatus: HorseProfileStatus.Disabled
                });
                done();
            });
    });

    it('should set aside a horse id for api deletion and remove it from local data', done => {
        /*
            deleteHorseById
                _cachedUnsyncedHorsesToDelete
                    _storageService.getUserData (get deletes)
                _storageService.setUserData (set deletes)
                _removeHorseToCreate
                    _cachedUnsyncedHorsesToCreate
                        _storageService.getUserData (get creates)
                    _storageService.setUserData (set creates)
                _removeHorseForList
                    _cachedHorsesForList
                        _storageService.getUserData (get list)
                    _storageService.setUserData (set list)
                _removeHorseForRide
                    _cachedHorsesForRide
                        _storageService.getUserData (get for ride)
                    _storageService.setUserData (set for rides)
                _removeHorseRelationships
                    _cachedHorseRelationships
                        _storageService.getUserData (get relationships)
                    _storageService.setUserData (set relationships)
                _removeHorseStatTotals
                    _cachedHorseStatTotals
                        _storageService.getUserData (get stat totals)
                    _storageService.setUserData (set stat totals)
        */
        const existingDeletes: string[] = [];
        const toCreate = [new Horse({_id: '0'})];
        const forList = [
            new HorseDetails({
                _id: '0',
                profile: new HorseProfile({profileStatus: HorseProfileStatus.Active})
            })
        ];
        const forRide = [new HorseForRide({_id: '0', profileStatus: HorseProfileStatus.Active})];
        const relationships = [
            {_id: '0', ...new HorseRelationshipsSimple()} as HorseRelationshipsSimpleWithId
        ];
        const totals = [{_id: '0', ...new HorseStatTotals()} as HorseStatTotalsWithId];
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(existingDeletes))
            .mockResolvedValueOnce(JSON.stringify(toCreate))
            .mockResolvedValueOnce(JSON.stringify(forList))
            .mockResolvedValueOnce(JSON.stringify(forRide))
            .mockResolvedValueOnce(JSON.stringify(relationships))
            .mockResolvedValueOnce(JSON.stringify(totals));
        horseCache
            .deleteHorseById('0')
            .pipe(take(1))
            .subscribe(() => {
                const storedDeletes = JSON.parse(MockStorageService.setUserData.mock.calls[0][1]);
                const storedCreates = JSON.parse(MockStorageService.setUserData.mock.calls[1][1]);
                const storedForList = JSON.parse(MockStorageService.setUserData.mock.calls[2][1]);
                const storedForRide = JSON.parse(MockStorageService.setUserData.mock.calls[3][1]);
                const storedRelationships = JSON.parse(
                    MockStorageService.setUserData.mock.calls[4][1]
                );
                const storedTotals = JSON.parse(MockStorageService.setUserData.mock.calls[5][1]);
                expect(storedDeletes[0]).toBe('0');
                expect(storedCreates).toHaveLength(0);
                expect(storedForList).toHaveLength(0);
                expect(storedForRide).toHaveLength(0);
                expect(storedRelationships).toHaveLength(0);
                expect(storedTotals).toHaveLength(0);
                done();
            });
    });

    it('should update local cache data when a newly completed ride is incorporated', done => {
        /*
            addFinalizedRide
                addFinalizedRideToHorse (once for each horse identity in ride)
                    _edithorseToCreate
                        _cachedUnsyncedHorses
                            _storageService.getUserData (to create)
                        _storageService.setUserData (if horse found)
                    _editHorseForList
                        _cachedHorsesForList
                            _storageService.getUserData (for list)
                        _storageService.setUserData (if horse found)
                    _editHorseForRide
                        _cachedHorsesForRide
                            _storageService.getUserData (for ride)
                        _storageService.setUserData (if horse found)
                    _editHorseStatTotals
                        _cachedHorseStatTotals
                            _storageservice.getUserData (stat totals)
                        _storageService.setUserData (if horse stats found)
        */
        const rideToAdd = new Ride({
            _id: '0',
            entryType: RideEntryType.RealTime,
            horseIdentities: [
                new HorseIdentityWithGaits({_id: '0', label: 'A'}),
                new HorseIdentityWithGaits({_id: '1', label: 'B'})
            ],
            distanceKilometers: 1,
            startDateTime: new Date(),
            calculatedGaitMinutes: [
                new RideGaitMetrics({horseId: '0', metrics: Gait.gaitNumbersZeroed()}),
                new RideGaitMetrics({horseId: '1', metrics: Gait.gaitNumbersZeroed()})
            ],
            riderIdentity: new UserIdentity({_id: '0', label: 'Q Q'})
        });
        rideToAdd.calculatedGaitMinutes[0].metrics[Gait.Walk] = 10;
        rideToAdd.calculatedGaitMinutes[1].metrics[Gait.Trot] = 10;

        const toCreate = [new Horse({_id: '1', profile: new HorseProfile({commonName: 'B'})})];
        const forList = [
            new HorseDetails({_id: '0', profile: new HorseProfile({commonName: 'A'})})
        ];
        const forRide = [new HorseForRide({_id: '0', commonName: 'A'})];
        const statTotals = [{_id: '0', ...new HorseStatTotals({})}];
        MockStore.select.mockReturnValue(
            of(new User({_id: '0', profile: new UserProfile({firstName: 'Q', lastName: 'Q'})}))
        );

        MockStorageService.setUserData.mockResolvedValue(undefined);

        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(toCreate))
            .mockResolvedValueOnce(JSON.stringify(forList))
            .mockResolvedValueOnce(JSON.stringify(forRide))
            .mockResolvedValueOnce(JSON.stringify(statTotals))
            .mockResolvedValueOnce(JSON.stringify(toCreate))
            .mockResolvedValueOnce(JSON.stringify(forList))
            .mockResolvedValueOnce(JSON.stringify(forRide))
            .mockResolvedValueOnce(JSON.stringify(statTotals));

        horseCache
            .addFinalizedRide(rideToAdd)
            .pipe(take(1))
            .subscribe(() => {
                const createCall = MockStorageService.setUserData.mock.calls.find(
                    c => c[0] === HorseCacheKeys.UnsyncedHorsesToCreate
                );
                const create = JSON.parse(createCall[1]) as Horse[];
                const forListCall = MockStorageService.setUserData.mock.calls.find(
                    c => c[0] === HorseCacheKeys.HorsesForList
                );
                const forList = JSON.parse(forListCall[1]) as HorseDetails[];
                const forRideCall = MockStorageService.setUserData.mock.calls.find(
                    c => c[0] === HorseCacheKeys.HorsesForRide
                );
                const forRide = JSON.parse(forRideCall[1]) as HorseForRide[];
                const statsCall = MockStorageService.setUserData.mock.calls.find(
                    c => c[0] === HorseCacheKeys.HorsesStatTotals
                );
                const stats = JSON.parse(statsCall[1]) as HorseStatTotals[];
                expect(create[0].finalizedRides).toHaveLength(1);
                expect(create[0].finalizedRides[0]._id).toBe('0');
                expect(forList[0].lastRideDate).toBeTruthy();
                expect(forList[0].lastRiderIdentity.label).toBe('Q Q');
                expect(forRide[0].rides[0].distanceKilometers).toBe(1);
                expect(forRide[0].rides[0].riderName).toBe('Q Q');
                expect(stats[0].totalDistanceKilometers).toBe(1);
                expect(stats[0].totalMinutes).toBe(10);
                expect(stats[0].averageMinutesPerRide).toBe(10);
                expect(stats[0].averageKilometersPerRide).toBe(1);
                expect(stats[0].totalRides).toBe(1);
                expect(stats[0].totalRides).toBe(1);
                expect(stats[0].riderNames[0]).toBe('Q Q');
                expect(stats[0].totalMinutesPerGait[Gait.Walk]).toBe(10);
                done();
            });
    });

    it('should apply a horse privacy profile edit to local data and set aside deltas for upload', done => {
        /*
            editHorsePrivacy
                _cachedUnsyncedHorsesPrivacyEdits
                        _storageService.getUserData (get privacy edits)
                    _storageService.setUserData (set privacy edits)
                    _editHorseForList
                        _cachedHorsesForList
                            _storageService.getUserData (get for list)
                        _storageService.setUserData (set for list)
        */
        const existingPrivacy: HorsePrivacyDto[] = [];
        const forList = [
            new HorseDetails({_id: '0', profile: new HorseProfile({commonName: 'A'})})
        ];
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.networkStatus.mockReturnValue(of({connected: false}));
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(existingPrivacy))
            .mockResolvedValueOnce(JSON.stringify(forList));
        horseCache
            .editHorsePrivacy('0', new HorseProfilePrivacy({bio: Privacy.Private}))
            .pipe(take(1))
            .subscribe(() => {
                const storedForList = JSON.parse(MockStorageService.setUserData.mock.calls[1][1]);
                expect(storedForList[0]).toMatchObject({profile: {privacy: {bio: Privacy.Private}}});
                done();
            });
    });
});
