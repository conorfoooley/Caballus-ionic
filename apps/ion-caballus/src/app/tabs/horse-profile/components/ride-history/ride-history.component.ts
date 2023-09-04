import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import {
  User,
  HorseService,
  kilometersToMiles,
  RideCategory,
  RideHistorySimple,
  RIDE_HISTORY_DEFAULT_FETCH_LIMIT,
  RideEntryType
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, iif, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  map,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';
import { PaginatedList } from '@rfx/common';

interface CustomEvent {
  target: {
    complete: Function;
    disabled: boolean;
  };
}

@Component({
  selector: 'app-ride-history',
  templateUrl: './ride-history.component.html',
  styleUrls: ['./ride-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideHistoryComponent implements OnInit, OnDestroy {
  public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _onDestroy$: Subject<void> = new Subject<void>();
  public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
  public readonly RideCategory: typeof RideCategory = RideCategory;
  private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
    map(params => params.get('horseId')),
    shareReplay(1)
  );

  public states: { key: string; name: string }[] = State.members.map(t => ({
    key: t,
    name: State.toString(t)
  }));
  public horseRides$: BehaviorSubject<{
    totalRides: number;
    currentPage: number;
    rides: RideHistorySimple[];
  }> = new BehaviorSubject({
    totalRides: 0,
    currentPage: 1,
    rides: []
  });

  constructor(
    private readonly _toastService: ToastService,
    private readonly _router: Router,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _horseService: HorseService
  ) {
  }

  public ngOnInit(): void {
    this.isLoading$.next(true);
    this._getHorseRides();
    this._router.events
      .pipe(
        filter(e => e instanceof NavigationStart),
        map(() => {
          const currentState = this._router.getCurrentNavigation();
          return currentState.extras.state;
        }),
        tap(state => {
          if (state?.isRefresh) {
            this.horseRides$.next({
              totalRides: 0,
              currentPage: 1,
              rides: []
            });
            this.isLoading$.next(true);
            this._getHorseRides();
          }
        })
      )
      .subscribe();
  }

  private _getHorseRides(event?: CustomEvent): void {
    const currentPage = this.horseRides$.getValue().currentPage;
    const rides = this.horseRides$.getValue().rides;
    const skipRecord =
      currentPage * RIDE_HISTORY_DEFAULT_FETCH_LIMIT - RIDE_HISTORY_DEFAULT_FETCH_LIMIT;
    this._horseId$
      .pipe(
        take(1),
        switchMap(id =>
          iif(() => !!id, this._horseService.getRideHistory(id, skipRecord), of(null))
        ),
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
    this._router.navigateByUrl('/tabs/horse-profile');
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
    if (ride.entryType === RideEntryType.Manual) {
      this._horseId$
        .pipe(
          take(1),
          tap(horseId => {
            this._router.navigate(
              [`/tabs/horse-profile/detail-horse/view-ride-entry-detail/${horseId}`],
              {
                state: {
                  ride
                }
              }
            );
          })
        )
        .subscribe();
    } else {
      this._horseId$
        .pipe(
          take(1),
          tap(horseId => {
            this._router.navigate(
              [`/tabs/horse-profile/detail-horse/view-ride-detail/${horseId}`],
              {
                state: {
                  ride
                }
              }
            );
          })
        )
        .subscribe();
    }
  }

  public addRideEvent(): void {
    this._horseId$
      .pipe(
        take(1),
        tap(horseId => {
          this._router.navigate([
            `/tabs/horse-profile/detail-horse/ride-history-add/${horseId}`
          ]);
        })
      )
      .subscribe();
  }

  public mapClicked(event) {
    event.preventDefault();
    event.stopPropagation();
  }
}
