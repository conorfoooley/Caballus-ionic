import { Injectable } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { CapacitorPluginService } from '../../services/capacitor-plugin.service';
import { Observable, of, from, forkJoin, iif, throwError } from 'rxjs';
import { take, switchMap, map, tap, share, concatAll, withLatestFrom } from 'rxjs/operators';
import { createObjectID } from 'mongo-object-reader';
import {
    Horse,
    HorseProfile,
    HorseProfileStatus,
    HorseForRide,
    HorseDetails,
    HorseRelationshipsSimple,
    HorseStatTotals,
    Gait,
    GaitNumbers,
    HorseBioDto,
    HorseGaitsDto,
    HorseService,
    Ride,
    RideSummary,
    RideEntryType,
    User,
    UserIdentity,
    HorseHealthDto,
    HorseHealthSimple,
    HorseVeterinarianProfileDto,
    HorseVeterinarianProfile,
    Privacy,
    HorseProfilePrivacy,
    HorsePrivacyDto,
    HorseEvaluationSimple,
    HorseEvaluationDto,
    HorseCompetitionSimple,
    HorseCompetitionDto
} from '@caballus/ui-common';
import { Select } from '@ngxs/store';
// TODO unwind this mess of a circular dependency
import { UserState } from '@ion-caballus/core/state/user.state';

/*
    The horse cache stores the most recent known server-side
    state of horses on disk, applying changes locally,
    and synchronizing changes to the API when network
    is available

    Newly created horses are stored in a pool. When different horse
    represenations are retrieved (e.g., ride options or list entries)
    the locally cached new horses are retrieved, transformed, and
    appended to this other data. Changes to new horses that have not
    yet been uploaded are applied directly to that data.

    Alternate represenations of horses (e.g., ride options, list entries)
    are downloaded and stored in their own pools. When edits are made
    to horses that exist on the server side, the individual changes
    are applied to data in each of these pools. The individual changes
    must also be set aside so they can be recalled for api upload.

    TODO:

    Monitor network status to trigger cache syncs
*/

enum Keys {
    HorsesForList = 'horses-for-list-',
    HorsesForRide = 'horses-for-ride-',
    HorsesRelationships = 'horse-relationships-',
    HorsesStatTotals = 'horse-stat-totals-',
    UnsyncedHorsesToCreate = 'unsynced-horses-to-create-',
    UnsyncedHorsesBioEdits = 'unsynced-horses-bio-edits-',
    UnsyncedHorsesPrivacyEdits = 'unsynced-horses-privacy-edits-',
    UnsyncedHorsesGaitsEdits = 'unsynced-horses-gaits-edits-',
    UnsyncedHorsesProfileStatusToggles = 'unsynced-horses-profile-status-toggles-',
    UnsyncedHorsesToDelete = 'unsynced-horses-to-delete-'
}

export { Keys as HorseCacheKeys };

export interface HorseRelationshipsSimpleWithId extends HorseRelationshipsSimple {
    _id: string;
}

export interface HorseStatTotalsWithId extends HorseStatTotals {
    _id: string;
}

@Injectable({ providedIn: 'root' })
export class HorseCache {
    @Select(UserState.user)
    public user$!: Observable<User>;

    private _currentUnsyncedChangesUpload$: Observable<void> = null;
    private _currentHorsesForRideDownload$: Observable<HorseForRide[]> = null;
    private _currentHorsesForListDownload$: Observable<HorseDetails[]> = null;
    private _currentHorsesRelationshipsDownload$: Observable<HorseRelationshipsSimpleWithId[]> =
        null;
    private _currentHorsesStatTotalsDownload$: Observable<HorseStatTotalsWithId[]> = null;

    constructor(
        private readonly _storageService: StorageService,
        private readonly _horseService: HorseService,
        private readonly _capacitorPluginService: CapacitorPluginService
    ) {}

    public sync(): Observable<void> {
        // upload changes and follow with download of current state
        return this._capacitorPluginService.networkStatus().pipe(
            switchMap(network =>
                !network.connected
                    ? of(undefined)
                    : this._uploadUnsyncedChanges().pipe(
                          switchMap(() =>
                              forkJoin([
                                  this._syncHorsesForRideCache(),
                                  this._syncHorseForListCache()
                              ])
                          ),
                          switchMap(() =>
                              // dependant on list contents
                              forkJoin([
                                  this._syncHorsesRelationshipsCache(),
                                  this._syncHorsesStatTotalsCache()
                              ])
                          ),
                          map(() => undefined)
                      )
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
        if (!this._currentUnsyncedChangesUpload$) {
            this._currentUnsyncedChangesUpload$ = this._uploadUnsyncedHorsesToCreate().pipe(
                switchMap(() =>
                    from(this._storageService.clearUserData(Keys.UnsyncedHorsesToCreate))
                ),
                switchMap(() =>
                    this._uploadUnsyncedHorsesToEditBios().pipe(
                        switchMap(() =>
                            from(this._storageService.clearUserData(Keys.UnsyncedHorsesBioEdits))
                        )
                    )
                ),
                switchMap(() =>
                    this._uploadUnsyncedHorseProfileStatusToggles().pipe(
                        switchMap(() =>
                            from(
                                this._storageService.clearUserData(
                                    Keys.UnsyncedHorsesProfileStatusToggles
                                )
                            )
                        )
                    )
                ),
                switchMap(() =>
                    this._uploadUnsyncedHorseGaitEdits().pipe(
                        switchMap(() =>
                            from(this._storageService.clearUserData(Keys.UnsyncedHorsesGaitsEdits))
                        )
                    )
                ),
                switchMap(() =>
                    this._uploadUnsyncedHorsesToDelete().pipe(
                        switchMap(() =>
                            from(this._storageService.clearUserData(Keys.UnsyncedHorsesToDelete))
                        )
                    )
                ),
                switchMap(() =>
                    this._uploadUnsyncedHorsesToEditPrivacy().pipe(
                        switchMap(() =>
                            from(
                                this._storageService.clearUserData(Keys.UnsyncedHorsesPrivacyEdits)
                            )
                        )
                    )
                ),
                tap(() => (this._currentUnsyncedChangesUpload$ = null)),
                share()
            );
        }
        return this._currentUnsyncedChangesUpload$;
    }

    /*
        Horse CRUD Operations
    */

    public getHorseBasic(id: string): Observable<Horse> {
        return this._horseService.getHorseBasic(id).pipe(map(h => new Horse(h)));
    }

    public getHorse(id: string): Observable<HorseDetails> {
        return this.getHorsesForList().pipe(
            map(forList => forList.find(h => h._id === id)),
            map(h => (!!h ? new HorseDetails(h) : null))
        );
    }

    public getHorseDistancePerRide(
        id: string
    ): Observable<{ date: Date; distanceKilometers: number }[]> {
        return this._horseService
            .getHorseDistancePerRide(id)
            .pipe(
                switchMap(horsesForList =>
                    from(
                        this._storageService.setUserData(
                            Keys.HorsesForList,
                            JSON.stringify(horsesForList)
                        )
                    ).pipe(map(() => horsesForList))
                )
            );
    }

    public createHorse(partial: Partial<Horse>): Observable<void> {
        const h = new Horse({
            ...partial,
            _id: createObjectID(),
            gaitsKilometersPerHour: Gait.defaultKilometersPerHour(),
            profile: {
                ...partial.profile,
                privacy: new HorseProfilePrivacy(Privacy.defaultPrivacy())
            }
        });
        return this._cachedUnsyncedHorsesToCreate().pipe(
            map(unsynced => [...unsynced, h]),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesToCreate,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            switchMap(() => this._uploadUnsyncedChangesIfConnected())
        );
    }

    public editHorseBio(id: string, p: HorseProfile): Observable<void> {
        const dto: HorseBioDto = {
            id,
            ...p
        };
        const editHorseToCreateBio = (h: Horse): Horse =>
            new Horse({
                ...h,
                profile: {
                    ...h.profile,
                    ...dto
                }
            });
        const editHorseForListBio = (h: HorseDetails): HorseDetails =>
            new HorseDetails({
                ...h,
                profile: {
                    ...h.profile,
                    ...dto
                }
            });
        const editHorseForRideBio = (h: HorseForRide): HorseForRide =>
            new HorseForRide({
                ...h,
                commonName: dto.commonName
            });
        return this._cachedUnsyncedHorsesBioEdits().pipe(
            // set edit aside for later upload
            map(unsynced => {
                const idx = unsynced.findIndex(u => u.id === id);
                if (idx >= 0) {
                    unsynced.splice(idx, 1, dto);
                } else {
                    unsynced = [...unsynced, dto];
                }
                return unsynced;
            }),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesBioEdits,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            // apply changes to local data
            switchMap(() =>
                forkJoin([
                    this._editHorseToCreate(id, editHorseToCreateBio),
                    this._editHorseForList(id, editHorseForListBio),
                    this._editHorseForRide(id, editHorseForRideBio)
                ])
            ),
            // conditional changes upload
            switchMap(() => this._uploadUnsyncedChangesIfConnected())
        );
    }

    public editHorseGaits(id: string, gaits: GaitNumbers): Observable<void> {
        const dto: HorseGaitsDto = {
            id,
            gaitsKilometersPerHour: gaits
        };
        const editHorseToCreateGaits = (h: Horse): Horse =>
            new Horse({
                ...h,
                gaitsKilometersPerHour: gaits
            });
        const editHorseForListGaits = (h: HorseDetails): HorseDetails =>
            new HorseDetails({
                ...h,
                gaitsKilometersPerHour: gaits
            });
        const editHorseForRideGaits = (h: HorseForRide): HorseForRide =>
            new HorseForRide({
                ...h,
                gaitsKilometersPerHour: gaits
            });
        return this._cachedUnsyncedHorsesGaitsEdits().pipe(
            map(unsynced => {
                const idx = unsynced.findIndex(u => u.id === id);
                if (idx >= 0) {
                    unsynced.splice(idx, 1, dto);
                } else {
                    unsynced = [...unsynced, dto];
                }
                return unsynced;
            }),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesGaitsEdits,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            switchMap(() =>
                forkJoin([
                    this._editHorseToCreate(id, editHorseToCreateGaits),
                    this._editHorseForList(id, editHorseForListGaits),
                    this._editHorseForRide(id, editHorseForRideGaits)
                ])
            ),
            switchMap(() => this._uploadUnsyncedChangesIfConnected())
        );
    }

    public editHorsePrivacy(id: string, privacy: HorseProfilePrivacy): Observable<void> {
        const dto: HorsePrivacyDto = {
            id,
            ...privacy
        };
        const editHorseForListBio = (h: HorseDetails): HorseDetails =>
            new HorseDetails({
                ...h,
                profile: {
                    ...h.profile,
                    privacy: {
                        ...h.profile.privacy,
                        ...privacy
                    }
                }
            });
        return this._cachedUnsyncedHorsesPrivacyEdits().pipe(
            map(unsynced => {
                const idx = unsynced.findIndex(u => u.id === id);
                if (idx >= 0) {
                    unsynced.splice(idx, 1, dto);
                } else {
                    unsynced = [...unsynced, dto];
                }
                return unsynced;
            }),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesPrivacyEdits,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            switchMap(() => this._editHorseForList(id, editHorseForListBio)),
            switchMap(() => this._uploadUnsyncedChangesIfConnected())
        );
    }

    public deleteHorseById(id: string): Observable<void> {
        return this._cachedUnsyncedHorsesToDelete().pipe(
            map(unsynced => [...unsynced, id]),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesToDelete,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            // apply changes to local data
            switchMap(() =>
                forkJoin([
                    this._removeHorseToCreate(id),
                    this._removeHorseForList(id),
                    this._removeHorseForRide(id),
                    this._removeHorseRelationships(id),
                    this._removeHorseStatTotals(id)
                ])
            ),
            // conditional changes upload
            switchMap(() => this._uploadUnsyncedChangesIfConnected())
        );
    }

    public toggleHorseProfileStatus(
        id: string,
        originalStatus: HorseProfileStatus
    ): Observable<HorseProfileStatus> {
        return this._cachedUnsyncedHorsesProfileStatusToggles().pipe(
            // set edits aside for later upload
            map(unsynced => {
                const idx = unsynced.findIndex(u => u === id);
                if (idx >= 0) {
                    unsynced.splice(idx, 1);
                } else {
                    unsynced = [...unsynced, id];
                }
                return unsynced;
            }),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesProfileStatusToggles,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            // transform for editing other caches
            map(() => {
                let newStatus = null;
                switch (originalStatus) {
                    case HorseProfileStatus.Active:
                        newStatus = HorseProfileStatus.Disabled;
                        break;
                    case HorseProfileStatus.Disabled:
                        newStatus = HorseProfileStatus.Active;
                        break;
                    default:
                        throw new Error(`Unsupported status ${originalStatus}`);
                }
                return { id, newStatus };
            }),
            // compose functions for editing local data
            map((v: { id: string; newStatus: HorseProfileStatus }) => {
                const editHorseToCreateProfileStatus = (h: Horse): Horse =>
                    new Horse({
                        ...h,
                        profile: {
                            ...h.profile,
                            profileStatus: v.newStatus
                        }
                    });
                const editHorseForListProfileStatus = (h: HorseDetails): HorseDetails =>
                    new HorseDetails({
                        ...h,
                        profile: {
                            ...h.profile,
                            profileStatus: v.newStatus
                        }
                    });
                const editHorseForRideProfileStatus = (h: HorseForRide): HorseForRide =>
                    new HorseForRide({
                        ...h,
                        profileStatus: v.newStatus
                    });
                return {
                    id: v.id,
                    newStatus: v.newStatus,
                    editHorseToCreateProfileStatus,
                    editHorseForListProfileStatus,
                    editHorseForRideProfileStatus
                };
            }),
            // apply changes to local data
            switchMap(
                (v: {
                    id: string;
                    newStatus: HorseProfileStatus;
                    editHorseToCreateProfileStatus: (h: Horse) => Horse;
                    editHorseForListProfileStatus: (h: HorseDetails) => HorseDetails;
                    editHorseForRideProfileStatus: (h: HorseForRide) => HorseForRide;
                }) =>
                    forkJoin([
                        this._editHorseToCreate(v.id, v.editHorseToCreateProfileStatus),
                        this._editHorseForList(v.id, v.editHorseForListProfileStatus),
                        this._editHorseForRide(v.id, v.editHorseForRideProfileStatus)
                    ]).pipe(
                        switchMap(() => this._uploadUnsyncedChangesIfConnected()),
                        map(() => v.newStatus)
                    )
            )
        );
    }

    private _cachedUnsyncedHorsesToCreate(): Observable<Horse[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedHorsesToCreate)).pipe(
            map(json => this._parseHorses(json))
        );
    }

    private _cachedUnsyncedHorsesBioEdits(): Observable<HorseBioDto[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedHorsesBioEdits)).pipe(
            map(json => this._parseHorseBioDtos(json))
        );
    }

    private _cachedUnsyncedHorsesPrivacyEdits(): Observable<HorsePrivacyDto[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedHorsesPrivacyEdits)).pipe(
            map(json => this._parseHorsePrivacyDtos(json))
        );
    }

    private _cachedUnsyncedHorsesProfileStatusToggles(): Observable<string[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedHorsesProfileStatusToggles)).pipe(
            map(json => this._parseStringArray(json))
        );
    }

    private _cachedUnsyncedHorsesGaitsEdits(): Observable<HorseGaitsDto[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedHorsesGaitsEdits)).pipe(
            map(json => this._parseHorseGaitDtos(json))
        );
    }

    private _cachedUnsyncedHorsesToDelete(): Observable<string[]> {
        return from(this._storageService.getUserData(Keys.UnsyncedHorsesToDelete)).pipe(
            map(json => this._parseStringArray(json))
        );
    }

    private _uploadUnsyncedHorsesToCreate(): Observable<void> {
        return this._cachedUnsyncedHorsesToCreate().pipe(
            switchMap(unsynced =>
                unsynced.length > 0
                    ? this._horseService.createHorses({ horses: unsynced })
                    : of(undefined)
            ),
            map(() => undefined)
        );
    }

    private _uploadUnsyncedHorsesToEditBios(): Observable<void> {
        return this._cachedUnsyncedHorsesBioEdits().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : forkJoin([unsynced.map(dto => this._horseService.editHorseBio(dto))])
            ),
            map(() => undefined)
        );
    }

    private _uploadUnsyncedHorsesToEditPrivacy(): Observable<void> {
        return this._cachedUnsyncedHorsesPrivacyEdits().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : forkJoin(
                          ...unsynced.map(dto => this._horseService.editHorsePrivacy(dto))
                      ).pipe(take(1))
            ),
            map(() => undefined)
        );
    }

    private _uploadUnsyncedHorseProfileStatusToggles(): Observable<HorseProfileStatus[]> {
        return this._cachedUnsyncedHorsesProfileStatusToggles().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : forkJoin(unsynced.map(id => this._horseService.toggleHorseProfileStatus(id)))
            )
        );
    }

    private _uploadUnsyncedHorseGaitEdits(): Observable<void[]> {
        return this._cachedUnsyncedHorsesGaitsEdits().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : forkJoin(unsynced.map(dto => this._horseService.editHorseGaits(dto)))
            )
        );
    }

    private _uploadUnsyncedHorsesToDelete(): Observable<void> {
        return this._cachedUnsyncedHorsesToDelete().pipe(
            switchMap(unsynced =>
                unsynced.length === 0
                    ? of(undefined)
                    : this._horseService.deleteHorsesByIds(unsynced)
            )
        );
    }

    private _parseHorses(json: string): Horse[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => new Horse(e)) : [];
    }

    private _parseHorseBioDtos(json: string): HorseBioDto[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => e as HorseBioDto) : [];
    }

    private _parseHorsePrivacyDtos(json: string): HorsePrivacyDto[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => e as HorsePrivacyDto) : [];
    }

    private _parseHorseGaitDtos(json: string): HorseGaitsDto[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => e as HorseGaitsDto) : [];
    }

    private _parseStringArray(json: string): string[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    }

    private _editHorseToCreate(id: string, fn: (h: Horse) => Horse): Observable<void> {
        return this._cachedUnsyncedHorsesToCreate().pipe(
            map(unsynced => ({
                unsynced,
                idx: unsynced.findIndex(h => h._id === id)
            })),
            map((v: { unsynced: Horse[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    const h = v.unsynced[v.idx];
                    const edited = fn(h);
                    v.unsynced.splice(v.idx, 1, edited);
                }
                return {
                    updated: v.unsynced,
                    save
                };
            }),
            switchMap((v: { updated: Horse[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.UnsyncedHorsesToCreate,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    private _removeHorseToCreate(id: string): Observable<void> {
        return this._cachedUnsyncedHorsesToCreate().pipe(
            map(unsynced => ({
                unsynced,
                idx: unsynced.findIndex(h => h._id === id)
            })),
            map((v: { unsynced: Horse[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    v.unsynced.splice(v.idx, 1);
                }
                return {
                    updated: v.unsynced,
                    save
                };
            }),
            switchMap((v: { updated: Horse[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.UnsyncedHorsesToCreate,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    /*
        Transforms to move locally created, unsynced horses
        to other representations
    */

    private _horseToHorseForRide(h: Horse): HorseForRide {
        return new HorseForRide({
            ...h,
            commonName: h.profile.commonName,
            profilePicture: h.profile.profilePicture,
            profileStatus: h.profile.profileStatus,
            rides: h.finalizedRides.map(
                r => new RideSummary({ ...r, riderName: r.riderIdentity.label })
            )
        });
    }

    private _horseToHorseForList(h: Horse): HorseDetails {
        return new HorseDetails({
            ...h,
            lastRideDate:
                h.finalizedRides.length > 0
                    ? new Date(h.finalizedRides[h.finalizedRides.length - 1].startDateTime)
                    : null,
            lastRiderIdentity:
                h.finalizedRides.length > 0
                    ? h.finalizedRides[h.finalizedRides.length - 1].riderIdentity
                    : null
        });
    }

    /*
        Horses for List
    */

    public getHorsesForList(): Observable<HorseDetails[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(networkStatus =>
                    networkStatus.connected
                        ? this._syncHorseForListCache()
                        : this._cachedHorsesForList()
                )
            );
    }

    private _syncHorseForListCache(): Observable<HorseDetails[]> {
        if (!this._currentHorsesForListDownload$) {
            this._currentHorsesForListDownload$ = this._downloadHorsesForList().pipe(
                tap(() => (this._currentHorsesForListDownload$ = null)),
                share()
            );
        }
        return this._currentHorsesForListDownload$;
    }

    private _downloadHorsesForList(): Observable<HorseDetails[]> {
        return this._horseService
            .getViewableHorses()
            .pipe(
                switchMap(horsesForList =>
                    from(
                        this._storageService.setUserData(
                            Keys.HorsesForList,
                            JSON.stringify(horsesForList)
                        )
                    ).pipe(map(() => horsesForList))
                )
            );
    }

    private _parseHorsesForList(json: string): HorseDetails[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => new HorseDetails(e)) : [];
    }

    private _cachedHorsesForList(includeCreate: boolean = true): Observable<HorseDetails[]> {
        return from(this._storageService.getUserData(Keys.HorsesForList)).pipe(
            map(json => this._parseHorsesForList(json)),
            switchMap(horsesForList =>
                !includeCreate
                    ? of(horsesForList)
                    : this._cachedUnsyncedHorsesToCreate().pipe(
                          map(toCreate => [
                              ...horsesForList,
                              ...toCreate.map(h => this._horseToHorseForList(h))
                          ])
                      )
            ),
            map(horses =>
                horses.sort((a, b) =>
                    a.profile.commonName?.toLowerCase() < b.profile.commonName?.toLowerCase()
                        ? -1
                        : 1
                )
            )
        );
    }

    private _editHorseForList(id: string, fn: (h: HorseDetails) => HorseDetails): Observable<void> {
        return this._cachedHorsesForList(false).pipe(
            map(forList => ({
                forList,
                idx: forList.findIndex(h => h._id === id)
            })),
            map((v: { forList: HorseDetails[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    const h = v.forList[v.idx];
                    const edited = fn(h);
                    v.forList.splice(v.idx, 1, edited);
                }
                return {
                    forList: v.forList,
                    save
                };
            }),
            switchMap((v: { forList: HorseDetails[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesForList,
                              JSON.stringify(v.forList)
                          )
                      )
            )
        );
    }

    private _removeHorseForList(id: string): Observable<void> {
        return this._cachedHorsesForList(false).pipe(
            map(forList => ({
                forList,
                idx: forList.findIndex(h => h._id === id)
            })),
            map((v: { forList: HorseDetails[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    v.forList.splice(v.idx, 1);
                }
                return {
                    updated: v.forList,
                    save
                };
            }),
            switchMap((v: { updated: HorseDetails[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesForList,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    /*
        Horses for Rides
    */

    public getHorsesForRide(): Observable<HorseForRide[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(status =>
                    status.connected ? this._syncHorsesForRideCache() : this._cachedHorsesForRide()
                )
            );
    }

    public addHorseForRide(
        h: Partial<Horse>
    ): Observable<{ horses: HorseForRide[]; newId: string }> {
        return this._cachedUnsyncedHorsesToCreate().pipe(
            map(unsynced => [...unsynced, h]),
            switchMap(allUnsynced =>
                from(
                    this._storageService.setUserData(
                        Keys.UnsyncedHorsesToCreate,
                        JSON.stringify(allUnsynced)
                    )
                )
            ),
            switchMap(() => this._uploadUnsyncedChangesIfConnected()),
            switchMap(() => this.getHorsesForRide()),
            map(horses => ({ horses, newId: h._id }))
        );
    }

    private _syncHorsesForRideCache(): Observable<HorseForRide[]> {
        if (!this._currentHorsesForRideDownload$) {
            this._currentHorsesForRideDownload$ = this._downloadHorsesForRide().pipe(
                tap(() => (this._currentHorsesForRideDownload$ = null)),
                share()
            );
        }
        return this._currentHorsesForRideDownload$;
    }

    private _downloadHorsesForRide(): Observable<HorseForRide[]> {
        return this._horseService
            .getHorsesForRide()
            .pipe(
                switchMap(horsesForRide =>
                    from(
                        this._storageService.setUserData(
                            Keys.HorsesForRide,
                            JSON.stringify(horsesForRide)
                        )
                    ).pipe(map(() => horsesForRide))
                )
            );
    }

    private _parseHorsesForRide(json: string): HorseForRide[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed.map(e => new HorseForRide(e)) : [];
    }

    private _cachedHorsesForRide(includeCreate: boolean = true): Observable<HorseForRide[]> {
        return from(this._storageService.getUserData(Keys.HorsesForRide)).pipe(
            map(json => this._parseHorsesForRide(json)),
            switchMap(horsesForRide =>
                !includeCreate
                    ? of(horsesForRide)
                    : this._cachedUnsyncedHorsesToCreate().pipe(
                          map(toCreate => [
                              ...horsesForRide,
                              ...toCreate.map(h => this._horseToHorseForRide(h))
                          ])
                      )
            ),
            map(horses => horses.filter(h => h.profileStatus === HorseProfileStatus.Active)),
            map(horses =>
                horses.sort((a, b) =>
                    a.commonName.toLowerCase() < b.commonName.toLowerCase() ? -1 : 1
                )
            )
        );
    }

    private _editHorseForRide(id: string, fn: (h: HorseForRide) => HorseForRide): Observable<void> {
        return this._cachedHorsesForRide(false).pipe(
            map(forRide => ({
                forRide,
                idx: forRide.findIndex(h => h._id === id)
            })),
            map((v: { forRide: HorseForRide[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    const h = v.forRide[v.idx];
                    const edited = fn(h);
                    v.forRide.splice(v.idx, 1, edited);
                }
                return {
                    forRide: v.forRide,
                    save
                };
            }),
            switchMap((v: { forRide: HorseForRide[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesForRide,
                              JSON.stringify(v.forRide)
                          )
                      )
            )
        );
    }

    private _removeHorseForRide(id: string): Observable<void> {
        return this._cachedHorsesForRide(false).pipe(
            map(forRide => ({
                forRide,
                idx: forRide.findIndex(h => h._id === id)
            })),
            map((v: { forRide: HorseForRide[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    v.forRide.splice(v.idx, 1);
                }
                return {
                    updated: v.forRide,
                    save
                };
            }),
            switchMap((v: { updated: HorseForRide[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesForRide,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    /*
        Horse Relationships
    */

    public getHorseRelationships(horseId: string): Observable<HorseRelationshipsSimple> {
        return this._capacitorPluginService.networkStatus().pipe(
            switchMap(networkStatus =>
                networkStatus.connected
                    ? this._syncHorseRelationshipsCache(horseId)
                    : this._cachedHorsesRelationships().pipe(
                          map(relationships => relationships.find(r => r._id === horseId))
                      )
            ),
            map(
                relationship =>
                    new HorseRelationshipsSimple(relationship as HorseRelationshipsSimple)
            )
        );
    }

    private _getHorsesRelationships(): Observable<HorseRelationshipsSimpleWithId[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(networkStatus =>
                    networkStatus.connected
                        ? this._syncHorsesRelationshipsCache()
                        : this._cachedHorsesRelationships()
                )
            );
    }

    private _syncHorsesRelationshipsCache(): Observable<HorseRelationshipsSimpleWithId[]> {
        if (!this._currentHorsesRelationshipsDownload$) {
            this._currentHorsesRelationshipsDownload$ = this._downloadHorsesRelationships().pipe(
                tap(() => (this._currentHorsesRelationshipsDownload$ = null)),
                share()
            );
        }
        return this._currentHorsesRelationshipsDownload$;
    }

    private _downloadHorsesRelationships(): Observable<HorseRelationshipsSimpleWithId[]> {
        return this.getHorsesForList().pipe(
            switchMap(details =>
                this._horseService.getHorseRelationshipsList(details.map(d => d._id))
            ),
            switchMap(relationships =>
                from(
                    this._storageService.setUserData(
                        Keys.HorsesRelationships,
                        JSON.stringify(relationships)
                    )
                ).pipe(map(() => relationships))
            )
        );
    }

    private _syncHorseRelationshipsCache(horseId: string): Observable<HorseRelationshipsSimple> {
        return this._horseService.getHorseRelationships(horseId).pipe(
            switchMap(relationship =>
                this._cachedHorsesRelationships().pipe(
                    map(relationships => ({ relationships, relationship }))
                )
            ),
            map(val => {
                const index = val.relationships.findIndex(r => r._id === horseId);
                const newRelationships = {
                    ...val.relationships[index],
                    ...val.relationship
                };
                return { relationship: val.relationship, newRelationships };
            }),
            switchMap(val =>
                from(
                    this._storageService.setUserData(
                        Keys.HorsesRelationships,
                        JSON.stringify(val.newRelationships)
                    )
                ).pipe(map(() => val.relationship))
            )
        );
    }

    private _parseHorsesRelationships(json: string): HorseRelationshipsSimpleWithId[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed)
            ? parsed.map(e => ({ ...new HorseRelationshipsSimple(e), _id: e._id }))
            : [];
    }

    private _cachedHorsesRelationships(): Observable<HorseRelationshipsSimpleWithId[]> {
        return from(this._storageService.getUserData(Keys.HorsesRelationships)).pipe(
            map(json => this._parseHorsesRelationships(json))
        );
    }

    private _removeHorseRelationships(horseId: string): Observable<void> {
        return this._cachedHorsesRelationships().pipe(
            map(relationships => ({
                relationships,
                idx: relationships.findIndex(r => r._id === horseId)
            })),
            map((v: { relationships: HorseRelationshipsSimpleWithId[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    v.relationships.splice(v.idx, 1);
                }
                return {
                    updated: v.relationships,
                    save
                };
            }),
            switchMap((v: { updated: HorseRelationshipsSimpleWithId[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesRelationships,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    /*
        Horse Stat Totals
    */

    public getHorseStatTotals(horseId: string): Observable<HorseStatTotals> {
        return this._capacitorPluginService.networkStatus().pipe(
            switchMap(networkStatus =>
                networkStatus.connected
                    ? this._syncHorseStatTotalsCache(horseId)
                    : this._cachedHorsesStatTotals().pipe(
                          map(statTotals => statTotals.find(s => s._id === horseId))
                      )
            ),
            map(totals => new HorseStatTotals(totals as HorseStatTotals))
        );
    }

    private _getHorsesStatTotals(): Observable<HorseStatTotalsWithId[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(networkStatus =>
                    networkStatus.connected
                        ? this._syncHorsesStatTotalsCache()
                        : this._cachedHorsesStatTotals()
                )
            );
    }

    private _syncHorsesStatTotalsCache(): Observable<HorseStatTotalsWithId[]> {
        if (!this._currentHorsesStatTotalsDownload$) {
            this._currentHorsesStatTotalsDownload$ = this._downloadHorsesStatTotals().pipe(
                tap(() => (this._currentHorsesStatTotalsDownload$ = null)),
                share()
            );
        }
        return this._currentHorsesStatTotalsDownload$;
    }

    private _downloadHorsesStatTotals(): Observable<HorseStatTotalsWithId[]> {
        return this.getHorsesForList().pipe(
            switchMap(details =>
                this._horseService.getHorseStatTotalsList(details.map(d => d._id))
            ),
            switchMap(statTotals =>
                from(
                    this._storageService.setUserData(
                        Keys.HorsesStatTotals,
                        JSON.stringify(statTotals)
                    )
                ).pipe(map(() => statTotals))
            )
        );
    }

    private _syncHorseStatTotalsCache(horseId: string): Observable<HorseStatTotals> {
        return this._horseService.getHorseStatTotals(horseId).pipe(
            switchMap(statTotal =>
                this._cachedHorsesStatTotals().pipe(map(statTotals => ({ statTotals, statTotal })))
            ),
            map(val => {
                const index = val.statTotals.findIndex(r => r._id === horseId);
                const newStatTotals = {
                    ...val.statTotals[index],
                    ...val.statTotal
                };
                return { statTotal: val.statTotal, newStatTotals };
            }),
            switchMap(val =>
                from(
                    this._storageService.setUserData(
                        Keys.HorsesStatTotals,
                        JSON.stringify(val.newStatTotals)
                    )
                ).pipe(map(() => val.statTotal))
            )
        );
    }

    private _parseHorsesStatTotals(json: string): HorseStatTotalsWithId[] {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed)
            ? parsed.map(e => ({ ...new HorseStatTotals(e), _id: e._id }))
            : [];
    }

    private _cachedHorsesStatTotals(): Observable<HorseStatTotalsWithId[]> {
        return from(this._storageService.getUserData(Keys.HorsesStatTotals)).pipe(
            map(json => this._parseHorsesStatTotals(json))
        );
    }

    private _editHorseStatTotals(
        horseId: string,
        fn: (t: HorseStatTotalsWithId) => HorseStatTotalsWithId
    ): Observable<void> {
        return this._cachedHorsesStatTotals().pipe(
            map(statTotals => ({
                statTotals,
                idx: statTotals.findIndex(t => t._id === horseId)
            })),
            map((v: { statTotals: HorseStatTotalsWithId[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    const t = v.statTotals[v.idx];
                    const edited = fn(t);
                    v.statTotals.splice(v.idx, 1, edited);
                }
                return {
                    updated: v.statTotals,
                    save
                };
            }),
            switchMap((v: { updated: HorseStatTotalsWithId[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesStatTotals,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    private _removeHorseStatTotals(horseId: string): Observable<void> {
        return this._cachedHorsesStatTotals().pipe(
            map(statTotals => ({
                statTotals,
                idx: statTotals.findIndex(t => t._id === horseId)
            })),
            map((v: { statTotals: HorseStatTotalsWithId[]; idx: number }) => {
                const save = v.idx >= 0;
                if (save) {
                    v.statTotals.splice(v.idx, 1);
                }
                return {
                    updated: v.statTotals,
                    save
                };
            }),
            switchMap((v: { updated: HorseStatTotalsWithId[]; save: boolean }) =>
                !v.save
                    ? of(undefined)
                    : from(
                          this._storageService.setUserData(
                              Keys.HorsesStatTotals,
                              JSON.stringify(v.updated)
                          )
                      )
            )
        );
    }

    /*
        Modify cache data to incorporate a newly finalized ride
    */

    public addFinalizedRide(ride: Ride): Observable<void> {
        const addFinalizedRideToHorse = (
            horseId: string,
            r: Ride,
            u: UserIdentity
        ): Observable<void> => {
            const addRideToHorseToCreate = (h: Horse): Horse =>
                new Horse({
                    ...h,
                    finalizedRides: [...h.finalizedRides, ride]
                });
            const addRideToHorseForList = (h: HorseDetails): HorseDetails =>
                new HorseDetails({
                    ...h,
                    lastRideDate: new Date(r.startDateTime),
                    lastRiderIdentity: u
                });
            const addRideToHorseForRide = (h: HorseForRide): HorseForRide =>
                new HorseForRide({
                    ...h,
                    rides: [
                        ...h.rides,
                        new RideSummary({
                            ...r,
                            riderName: u.label
                        })
                    ]
                });
            const addRideToStatTotals = (t: HorseStatTotalsWithId): HorseStatTotalsWithId => ({
                _id: t._id,
                ...(r.entryType === RideEntryType.RealTime
                    ? new HorseStatTotals(t).addRide(horseId, r)
                    : t)
            });
            return forkJoin([
                this._editHorseToCreate(horseId, addRideToHorseToCreate),
                this._editHorseForList(horseId, addRideToHorseForList),
                this._editHorseForRide(horseId, addRideToHorseForRide),
                this._editHorseStatTotals(horseId, addRideToStatTotals)
            ]).pipe(map(() => undefined));
        };
        return from(ride.horseIdentities).pipe(
            withLatestFrom(this.user$),
            map(([horse, user]) => addFinalizedRideToHorse(horse._id, ride, user.toIdentity())),
            concatAll()
        );
    }

    public getHorseHealthByHorseId(horseId: string): Observable<HorseHealthSimple[]> {
        return this._horseService.getHorseHealthByHorseId(horseId);
    }

    public createHorseHealth(dto: HorseHealthDto, documents: File[]): Observable<string> {
        const horseHealthId = createObjectID();
        return this._horseService.createHorseHealth(horseHealthId, dto, documents);
    }

    public editHorseHealth(
        horseHealthId: string,
        dto: HorseHealthDto,
        documents: File[]
    ): Observable<void> {
        return this._horseService.editHorseHealth(horseHealthId, dto.horseId, dto, documents);
    }

    public deleteHorseHealthDocument(id: string, horseId: string): Observable<void> {
        return this._horseService.deleteHorseHealthDocument(id, horseId);
    }

    public deleteHorseHealth(id: string, horseId: string): Observable<void> {
        return this._horseService.deleteHorseHealth(id, horseId);
    }

    public getHorseVeterinarianProfileByHorseId(
        horseId: string
    ): Observable<HorseVeterinarianProfile> {
        return this._horseService.getHorseVeterinarianProfileByHorseId(horseId);
    }

    public updateHorseVeterinarianProfileByHorseId(
        horseVeterinarianProfile: HorseVeterinarianProfileDto,
        horseId: string
    ): Observable<void> {
        return this._horseService.updateHorseVeterinarianProfileByHorseId(
            horseId,
            horseVeterinarianProfile
        );
    }

    public getHorseEvaluationByHorseId(horseId: string): Observable<HorseEvaluationSimple[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    iif(
                        () => !!network.connected,
                        this._horseService.getHorseEvaluationByHorseId(horseId),
                        throwError(
                            'Poor internet connectivity. Please connect to the internet to do an evaluation.'
                        )
                    )
                )
            );
    }

    public createHorseEvaluation(horseId: string, dto: HorseEvaluationDto): Observable<string> {
        const horseEvaluationId = createObjectID();
        const evaluation = {
            ...dto,
            _id: horseEvaluationId
        };
        return this._horseService.createHorseEvaluationByHorseId(horseId, evaluation);
    }

    public editHorseEvaluation(
        evaluationId: string,
        horseId: string,
        dto: HorseEvaluationDto
    ): Observable<void> {
        return this._horseService.editHorseEvaluationById(evaluationId, horseId, dto);
    }

    public deleteHorseEvaluationById(id: string, horseId: string): Observable<void> {
        return this._horseService.deleteHorseEvaluationById(id, horseId);
    }

    public getHorseCompetitionByHorseId(horseId: string): Observable<HorseCompetitionSimple[]> {
        return this._capacitorPluginService
            .networkStatus()
            .pipe(
                switchMap(network =>
                    iif(
                        () => !!network.connected,
                        this._horseService.getHorseCompetitionByHorseId(horseId),
                        throwError(
                            'Poor internet connectivity. Please connect to the internet to do an competition.'
                        )
                    )
                )
            );
    }

    public createHorseCompetition(
        horseId: string,
        dto: HorseCompetitionDto,
        image?: File
    ): Observable<string> {
        const horseCompetitionId = createObjectID();
        const competition = {
            ...dto,
            _id: horseCompetitionId
        };
        return this._horseService.createHorseCompetitionByHorseId(horseId, competition, image);
    }

    public editHorseCompetition(
        horseId: string,
        competitionId: string,
        dto: HorseCompetitionDto,
        removeImage: boolean,
        image?: File
    ): Observable<void> {
        if (removeImage && !image) {
            this._horseService.deleteHorseCompetitionPictureById(competitionId, horseId);
        }
        return this._horseService.editHorseCompetitionById(
            horseId,
            competitionId,
            dto,
            removeImage,
            image
        );
    }

    public deleteHorseCompetitionById(id: string, horseId: string): Observable<void> {
        return this._horseService.deleteHorseCompetitionById(id, horseId);
    }
}
