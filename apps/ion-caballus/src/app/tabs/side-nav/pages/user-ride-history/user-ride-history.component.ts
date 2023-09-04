import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    HorseService,
    kilometersToMiles,
    RIDE_HISTORY_DEFAULT_FETCH_LIMIT,
    RideCategory,
    RideHistorySimple,
    UserProfile,
    UserService
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';
import { PaginatedList } from '@rfx/common';
import { Location } from '@angular/common';

interface CustomEvent {
    target: {
        complete: Function;
        disabled: boolean;
    };
}

@Component({
    selector: 'app-user-ride-history',
    templateUrl: './user-ride-history.component.html',
    styleUrls: ['./user-ride-history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserRideHistoryComponent implements OnInit {
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _onDestroy$: Subject<void> = new Subject<void>();
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly RideCategory: typeof RideCategory = RideCategory;

    public states: { key: string; name: string }[] = State.members.map(t => ({
        key: t,
        name: State.toString(t)
    }));
    public userId!: string;
    public horseRides$: BehaviorSubject<{
        totalRides: number;
        currentPage: number;
        rides: RideHistorySimple[];
    }> = new BehaviorSubject({
        totalRides: 0,
        currentPage: 1,
        rides: []
    });
    public user$: BehaviorSubject<UserProfile> = new BehaviorSubject(null);
    private _user!: UserProfile;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseService: HorseService,
        private readonly _userService: UserService,
        private readonly _location: Location
    ) {}

    public ngOnInit(): void {
        this.isLoading$.next(true);
        // get user id from the route
        this._activatedRoute.paramMap
            .pipe(
                take(1),
                switchMap(params => {
                    this.userId = params.get('id');
                    if (!this.userId) {
                        // get current user
                        return this._getCurrentUser();
                    } else if (this.userId) {
                        // get user details by id
                        return this._getUserById(this.userId);
                    }
                }),
                catchError(() => {
                    this.isLoading$.next(false);
                    this._toastService.error('Error getting user details!');
                    return of(null);
                })
            )
            .subscribe(res => {
                this.user$.next(res);
                this._user = res;

                this._getHorseRides();
            });
    }

    private _getHorseRides(event?: CustomEvent): void {
        const currentPage = this.horseRides$.getValue().currentPage;
        const rides = this.horseRides$.getValue().rides;
        const skipRecord =
            currentPage * RIDE_HISTORY_DEFAULT_FETCH_LIMIT - RIDE_HISTORY_DEFAULT_FETCH_LIMIT;
        this._horseService
            .getRideHistoryByUserId(this._user._id, skipRecord)
            .pipe(
                take(1),
                tap((horseRides: PaginatedList<RideHistorySimple>) => {
                    this.horseRides$.next({
                        totalRides: horseRides.count,
                        rides: [...rides, ...horseRides.docs],
                        currentPage: currentPage + 1
                    });
                    if (event) {
                        event.target.complete();
                    }
                }),
                catchError(() => {
                    this._toastService.error('Error getting horse ride history');
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading$.next(false);
                })
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public goBack(): void {
        this._location.back();
    }

    public async loadRideHistory(event): Promise<void> {
        const horseRides = this.horseRides$.getValue();
        if (horseRides.totalRides > horseRides.rides.length) {
            this._getHorseRides(event);
        } else {
            event.target.complete();
            event.target.disabled = false;
        }
    }

    public goToRideDetail(ride: RideHistorySimple): void {
        const horseId = ride.horseIdentities[0]._id;

        this._router.navigate([`/tabs/menu/ride-history-detail/${horseId}`], {
            state: {
                ride,
                entryType: ride.entryType,
                returnToRideHistory: true
            }
        });
    }

    public addRideEvent(): void {
        this._router.navigate([`/tabs/menu/ride-history-add`]);
    }

    /**
     * _getCurrentUser
     * It will return current logged-in user
     * @private
     */
    private _getCurrentUser(): Observable<UserProfile> {
        return this._userService.getLoggedInUser().pipe(
            takeUntil(this._onDestroy$),
            map(res => {
                this.user$.next(res.profile);
                return res.profile;
            }),
            catchError(err => {
                this._toastService.error(err);
                return of(err);
            })
        );
    }

    /**
     * _getUserById
     * get user details by user id
     * @param userId
     * @private
     */
    private _getUserById(userId: string): Observable<UserProfile> {
        return this._userService.getProfile(userId).pipe(
            takeUntil(this._onDestroy$),
            map(user => {
                this.user$.next(user);
                return user;
            })
        );
    }
}
