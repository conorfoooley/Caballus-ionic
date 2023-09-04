import { formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AppRideStatus,
  BLUE_COLOR,
  BranchService,
  calculateRideTime,
  Gait,
  GaitDetailTab,
  GaitNumbers,
  getRideKilometers,
  getRideKilometersPerGait,
  getRideMinutesPerGait,
  kilometersToMiles,
  Media,
  milesToKilometers,
  ModalService,
  RED_COLOR,
  Ride,
  RideCategory,
  RideGaitMetrics,
  RideService
} from '@caballus/ui-common';
import { HorseCache, MediaCache } from '@ion-caballus/core/caches';
import { ToastService } from '@rfx/ngx-toast';
import _, { isNil } from 'lodash';
import { Chart } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { BehaviorSubject, from, iif, Observable, of, Subject, timer } from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  takeWhile,
  tap
} from 'rxjs/operators';
import { ModalService as IonModalService, StorageService } from '@ion-caballus/core/services';
import { RideCacheKeys } from '@ion-caballus/core/caches/ride/ride.cache';
import { GeoPoint, getCenterpoint, MINIMUM_RIDE_DURATION, WayPoint } from '@caballus/common';
import { Select } from '@ngxs/store';
import { RideState, UserState } from '@ion-caballus/core/state';
import { Emittable, Emitter } from '@ngxs-labs/emitter';
import { environment } from '@ion-caballus/env';
import { Share } from '@capacitor/share';
import { LoadingController } from '@ionic/angular';

interface SaveRideDetails {
  category: RideCategory;
  notes: string;
}

const DigitsInfo = '1.2-2';
const GraphDomTimeout = 3000;

@Component({
  selector: 'app-end-ride-details',
  templateUrl: './end-ride-details.component.html',
  styleUrls: ['./end-ride-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndRideDetailsComponent implements OnInit, OnDestroy {
  @Select(RideState)
  public readonly rideState$!: Observable<Ride | null>;

  @Select(RideState.wayPoints)
  public readonly wayPoints$!: Observable<WayPoint[] | null>;

  @Select(UserState.doesUserHaveActiveSubscription)
  public doesUserHaveActiveSubscription$!: Observable<boolean>;

  @Emitter(RideState.saveRide)
  private readonly _saveRide!: Emittable<SaveRideDetails>;

  @Emitter(RideState.cancel)
  private readonly _cancelRide!: Emittable<void>;

  public gaitKilometersStats$!: Observable<Record<string, GaitNumbers>>;
  public gaitMinutesStats$!: Observable<Record<string, GaitNumbers>>;
  public rideDurationStats$!: Observable<Record<string, number>>;
  public ride$!: Observable<Ride>;

  private readonly _onDestroy$: Subject<void> = new Subject();
  public readonly RideCategory: typeof RideCategory = RideCategory;
  // start
  public readonly GaitDetailTab: typeof GaitDetailTab = GaitDetailTab;
  public gaitProfileType: GaitDetailTab = GaitDetailTab.PROFILE;
  public barCharts: Record<string, Chart> = {};
  public gaitSettingForm: Record<string, FormGroup> = {};
  public isGaitLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public showBarChart = true;
  public gaitSettingPlaceholder: GaitNumbers = Gait.defaultKilometersPerHour();
  public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
  public Gait: typeof Gait = Gait;
  public selectedHorse$: BehaviorSubject<number> = new BehaviorSubject(0);
  public form: FormGroup = this._formBuilder.group({
    notes: [null],
    category: [null, Validators.required]
  });

  public gaitData$: Subject<Gait> = new Subject();
  public currentRideMedia$: BehaviorSubject<Media[]> = new BehaviorSubject([]);
  public readonly mediaUpdates$: BehaviorSubject<Media[]> = new BehaviorSubject(
    []
  );
  public totalMinutes$: BehaviorSubject<Record<string, number>> =
    new BehaviorSubject({});
  private _hasFocusFirstTime$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private _oldGaitProfile$: BehaviorSubject<
    Record<string, Record<Gait, number>>
  > = new BehaviorSubject({});
  public hasUpdateProfile$: BehaviorSubject<Record<string, boolean>> =
    new BehaviorSubject({});

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _mediaCache: MediaCache,
    private readonly _router: Router,
    private readonly _modalService: ModalService,
    private readonly _toastService: ToastService,
    private readonly _horseCache: HorseCache,
    @Inject(LOCALE_ID) private readonly _locale: string,
    private readonly _storageService: StorageService,
    private readonly _ionModalService: IonModalService,
    private readonly _branchService: BranchService,
    private readonly _rideService: RideService,
    private _loader: LoadingController
  ) {
  }

  public isRideSaved(ride: Ride): boolean {
    // If the ride is finalized and _still_ present then it means it didn't
    // send to the server yet and should show up as "Saved"
    return ride.appRideStatus === AppRideStatus.Finalized;
  }

  public ngOnInit(): void {
    this.ride$ = this.rideState$.pipe(takeWhile((ride) => !!ride));
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  public ionViewWillEnter(): void {
    // TODO Convert to use storage service
    const previousCategory = localStorage.getItem('last-used-category');
    if (previousCategory) {
      this.form.patchValue({ category: previousCategory });
    }

    this.ride$ = this.rideState$.pipe(takeWhile((ride) => !!ride));

    // TODO Should these all unsubscribe when ride is null? Does this
    // component only ever get initialized with a ride?
    //
    // Maybe ride should be injected directly instead of piped in from
    // state.
    this.gaitKilometersStats$ = this.ride$.pipe(
      map((ride) =>
        _.chain(ride.calculatedGaitKilometers)
          .keyBy('horseId')
          .mapValues('metrics')
          .value()
      ),
      shareReplay(1)
    );

    this.gaitMinutesStats$ = this.ride$.pipe(
      map((ride) =>
        _.chain(ride.calculatedGaitMinutes)
          .keyBy('horseId')
          .mapValues('metrics')
          .value()
      ),
      shareReplay(1)
    );

    this.rideDurationStats$ = this.ride$.pipe(
      map((ride) =>
        _.chain(ride.horseIdentities)
          .keyBy('_id')
          .mapValues((horse) => ride.totalMinutesForHorse(horse._id))
          .value()
      ),
      shareReplay(1)
    );

    this.ride$
      .pipe(
        takeUntil(this._onDestroy$),
        filter((ride) => !isNil(ride)),
        map(this.isRideSaved),
        distinctUntilChanged()
      )
      .subscribe((isSaved) => {
        if (isSaved) {
          this.form.disable();
        } else {
          this.form.enable();
        }
      });

    this.ride$.pipe(takeUntil(this._onDestroy$)).subscribe((ride) => {
      // get current ride medias
      this._mediaCache
        .getRideMedia(ride._id)
        .pipe(take(1), defaultIfEmpty([]))
        .subscribe((media) => {
          this.currentRideMedia$.next(media);
        });

      ride.horseIdentities.forEach(
        ({ _id, gaitsKilometersPerHourSnapshot }) => {
          timer(GraphDomTimeout).subscribe(() => {
            const calculatedGaitMinutes = ride.calculatedGaitMinutes.find(
              (item) => item.horseId === _id
            ).metrics;
            const calculatedGaitKilometers = ride.calculatedGaitKilometers.find(
              (item) => item.horseId === _id
            ).metrics;

            this.gaitSettingForm[_id] = this._formBuilder.group({
              walk: [
                formatNumber(
                  kilometersToMiles(gaitsKilometersPerHourSnapshot[Gait.Walk]),
                  this._locale,
                  DigitsInfo
                ),
                Validators.required
              ],
              trot: [
                formatNumber(
                  kilometersToMiles(gaitsKilometersPerHourSnapshot[Gait.Trot]),
                  this._locale,
                  DigitsInfo
                ),
                Validators.required
              ],
              lope: [
                formatNumber(
                  kilometersToMiles(gaitsKilometersPerHourSnapshot[Gait.Lope]),
                  this._locale,
                  DigitsInfo
                ),
                Validators.required
              ],
              gallop: [
                formatNumber(
                  kilometersToMiles(
                    gaitsKilometersPerHourSnapshot[Gait.Gallop]
                  ),
                  this._locale,
                  DigitsInfo
                ),
                Validators.required
              ]
            });
            this._createCharts(_id);
            this._updateGaitProfileChart(
              _id,
              calculatedGaitMinutes,
              calculatedGaitKilometers
            );
          });
        }
      );
    });
  }

  public ionViewWillLeave(): void {
    this.form.reset();
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  private _showCategoryAlert(): Observable<undefined> {
    return this._modalService
      .message(
        'Specify a Category',
        'Please select at least one category before saving ride.',
        ''
      )
      .afterClosed();
  }

  public saveRide(): void {
    const category = this.form.get('category').value;
    localStorage.setItem('last-used-category', category);
    if (!category) {
      this._showCategoryAlert();
      return;
    }

    const notes = this.form.get('notes').value;
    this.ride$
      .pipe(
        take(1),
        tap((ride) => {
          const wayPoints = _.flatMap(ride.paths, 'wayPoints') as WayPoint[];
          const centerPoint = getCenterpoint(wayPoints, false);
          if (
            calculateRideTime(ride) > MINIMUM_RIDE_DURATION &&
            centerPoint?.latitude &&
            centerPoint?.longitude
          ) {
            this._save(category, notes);
          } else {
            this._deleteInCompleteRide(ride._id);
          }
        })
      )
      .subscribe();
  }

  private _save(category: RideCategory, notes: string): void {
    from(
      this._loader.create({
        message: 'Saving Ride...',
        backdropDismiss: false
      })
    ).pipe(
      switchMap((loader: HTMLIonLoadingElement) => from(loader.present()).pipe(map(() => loader))
      ),
      switchMap((loader: HTMLIonLoadingElement) =>
        this._saveRide.emit({ category, notes }).pipe(map(() => loader))
      ),
      tap(loader => {
        loader.dismiss().then(() => this.shareRide());
      })
    ).subscribe();
  }

  private _deleteInCompleteRide(rideId: string): void {
    this._ionModalService
      .deleteIncompleteRide(rideId)
      .pipe(
        switchMap(() => this._cancelRide.emit()),
        tap(() => {
          this._router.navigate(['/tabs/map-my-ride']);
          this._toastService.info('Ride deleted');
        })
      )
      .subscribe();
  }

  public shareRide(): void {
    this._ionModalService
      .endRideShareModal()
      .pipe(
        switchMap(({ share }) => iif(() => share, this.ride$.pipe(), of(null))),
        tap(async (ride: Ride) => {
          if (ride) {
            const horse = ride.horseIdentities[0];
            const route = `/tabs/share-ride?horseId=${horse._id}&rideId=${ride._id}`;
            const desktopUrl = `${environment.ionBaseUrl}/${route}`;
            const title = `I just rode ${horse.label}`;
            const description = [`${title}, See my ride on the Caballus app: `];

            const shareUrl = `${environment.webserver}/horse/profile/share?id=${
              horse._id
            }&title=${encodeURIComponent(title)}&image=${encodeURIComponent(
              horse.picture?.url
            )}&description=${encodeURIComponent(
              description.join('')
            )}&desktopUrl=${encodeURIComponent(desktopUrl)}`;
            const deeplink = await this._branchService.generateNewDeepLink(
              shareUrl,
              route
            );
            description.push(deeplink);

            try {
              await Share.share({
                title,
                text: description.join(''),
                dialogTitle: title
              });
            } catch (error) {
              console.error(error);
            }
          }
          this._router.navigate(['/tabs/map-my-ride']);
        })
      )
      .subscribe();
  }

  public deleteRide(): void {
    this._modalService
      .confirm(
        'Delete ride',
        'Are you sure you want to delete this ride? This cannot be undone and all data will be lost.',
        'Yes, Delete Ride',
        'endRideDetailsComponent'
      )
      .afterClosed()
      .pipe(
        take(1),
        switchMap((confirm) => iif(() => !!confirm, this.ride$, of(null))),
        switchMap((ride) =>
          iif(() => !!ride, this._rideService.deleteRide(ride._id), of(true))
        ),
        switchMap((isNotDeleted) =>
          iif(() => !isNotDeleted, this._cancelRide.emit(), of(true))
        ),
        tap((isNotEmitCancelEvent) => {
          if (isNotEmitCancelEvent) {
            this._router.navigate(['/tabs/map-my-ride']);
            this._toastService.info('Ride deleted');
          }
        })
      )
      .subscribe();
  }

  public handleAttachedMedia(attachedMedia: Media[]): void {
    this.mediaUpdates$.next(attachedMedia);
  }

  public onGaitSettingSave(horseId: string): void {
    if (this.gaitSettingForm[horseId].invalid) {
      return;
    }
    const updateGait = {
      [Gait.Gallop]: milesToKilometers(
        this.gaitSettingForm[horseId].value.gallop
      ),
      [Gait.Walk]: milesToKilometers(this.gaitSettingForm[horseId].value.walk),
      [Gait.Trot]: milesToKilometers(this.gaitSettingForm[horseId].value.trot),
      [Gait.Lope]: milesToKilometers(this.gaitSettingForm[horseId].value.lope),
      [Gait.None]: 0
    };
    this._modalService
      .openActionDialog(
        'Warning',
        `The new gait times you have entered have been saved, and the gait distances have also been adjusted.
             This ride is now marked a manual entry.  If you would like to change that you may click "reset"
              which will restore the original values and reset the flag.
             You can not change this after you click "Save Ride" above.`,
        'Okay'
      )
      .afterClosed()
      .pipe(
        take(1),
        map(() => {
          this.isGaitLoading$.next(true);
        }),
        switchMapTo(this.ride$),
        take(1),
        map((ride) => {
          const horseIndex = ride.horseIdentities.findIndex(
            ({ _id }) => _id === horseId
          );
          const oldGaitProfile = this._oldGaitProfile$.getValue();
          if (!oldGaitProfile[horseId]) {
            this._oldGaitProfile$.next({
              ...this._oldGaitProfile$.getValue(),
              ...{
                [horseId]: {
                  ...ride.horseIdentities[horseIndex]
                    .gaitsKilometersPerHourSnapshot
                }
              }
            });
          }
          ride.horseIdentities[horseIndex].gaitsKilometersPerHourSnapshot =
            updateGait;
          return ride;
        }),
        switchMap((currentRide) => {
          currentRide.distanceKilometers = getRideKilometers(currentRide);
          currentRide.calculatedGaitMinutes = [];
          currentRide.calculatedGaitKilometers = [];
          for (const h of currentRide.horseIdentities) {
            currentRide.calculatedGaitMinutes.push(
              new RideGaitMetrics({
                horseId: h._id,
                metrics: getRideMinutesPerGait(
                  currentRide,
                  h.gaitsKilometersPerHourSnapshot
                )
              })
            );
            currentRide.calculatedGaitKilometers.push(
              new RideGaitMetrics({
                horseId: h._id,
                metrics: getRideKilometersPerGait(
                  currentRide,
                  h.gaitsKilometersPerHourSnapshot
                )
              })
            );
          }
          return from(
            this._storageService.setUserData(
              RideCacheKeys.CurrentRide,
              JSON.stringify(currentRide)
            )
          );
        }),
        switchMap(() => this._horseCache.editHorseGaits(horseId, updateGait)),
        tap(() => {
          this._toastService.success('Setting has been saved');
          this.isGaitLoading$.next(false);
          this.hasUpdateProfile$.next({
            ...this.hasUpdateProfile$.getValue(),
            ...{
              [horseId]: true
            }
          });
          // this._getRide();
        }),
        catchError(() => {
          this._toastService.error('Error while saving horse gait setting');
          this.isGaitLoading$.next(false);
          return of(null);
        })
      )
      .subscribe();
  }

  public onGaitReset(horseId: string): void {
    const defaultSetting = this._oldGaitProfile$.getValue()[horseId];
    this.gaitSettingForm[horseId].patchValue({
      gallop: formatNumber(
        kilometersToMiles(defaultSetting[Gait.Gallop]),
        this._locale,
        DigitsInfo
      ),
      walk: formatNumber(
        kilometersToMiles(defaultSetting[Gait.Walk]),
        this._locale,
        DigitsInfo
      ),
      lope: formatNumber(
        kilometersToMiles(defaultSetting[Gait.Lope]),
        this._locale,
        DigitsInfo
      ),
      trot: formatNumber(
        kilometersToMiles(defaultSetting[Gait.Trot]),
        this._locale,
        DigitsInfo
      )
    });
    const resetGait = this._oldGaitProfile$.getValue()[horseId];
    this.ride$
      .pipe(
        take(1),
        map((ride) => {
          const horseIndex = ride.horseIdentities.findIndex(
            ({ _id }) => _id === horseId
          );
          const oldGaitProfile = this._oldGaitProfile$.getValue();
          if (!oldGaitProfile[horseId]) {
            this._oldGaitProfile$.next({
              ...this._oldGaitProfile$.getValue(),
              ...{
                [horseId]: {
                  ...ride.horseIdentities[horseIndex]
                    .gaitsKilometersPerHourSnapshot
                }
              }
            });
          }
          ride.horseIdentities[horseIndex].gaitsKilometersPerHourSnapshot =
            resetGait;
          return ride;
        }),
        switchMap((currentRide) => {
          currentRide.distanceKilometers = getRideKilometers(currentRide);
          currentRide.calculatedGaitMinutes = [];
          currentRide.calculatedGaitKilometers = [];
          for (const h of currentRide.horseIdentities) {
            currentRide.calculatedGaitMinutes.push(
              new RideGaitMetrics({
                horseId: h._id,
                metrics: getRideMinutesPerGait(
                  currentRide,
                  h.gaitsKilometersPerHourSnapshot
                )
              })
            );
            currentRide.calculatedGaitKilometers.push(
              new RideGaitMetrics({
                horseId: h._id,
                metrics: getRideKilometersPerGait(
                  currentRide,
                  h.gaitsKilometersPerHourSnapshot
                )
              })
            );
          }
          return from(
            this._storageService.setUserData(
              RideCacheKeys.CurrentRide,
              JSON.stringify(currentRide)
            )
          );
        }),
        switchMap(() => this._horseCache.editHorseGaits(horseId, resetGait)),
        map(() => {
          this.isGaitLoading$.next(false);
          this.hasUpdateProfile$.next({
            ...this.hasUpdateProfile$.getValue(),
            ...{
              [horseId]: false
            }
          });
          // this._getRide();
        }),
        switchMapTo(
          this._modalService
            .openActionDialog(
              'Warning',
              `The values have been reset to those that were recorded during the ride and the ride is no longer marked as a manual entry.`,
              'Okay'
            )
            .afterClosed()
        )
      )
      .subscribe();
  }

  public selectTab($event): void {
    const type: GaitDetailTab = $event.target.value;
    if (type === GaitDetailTab.PROFILE) {
      this.showBarChart = false;
    } else {
      this.showBarChart = true;
    }
    this.gaitProfileType = type;
  }

  private _createCharts(horseId: string): void {
    if (this.barCharts[horseId]) {
      // destroy existing chart before re-rendering
      this.barCharts[horseId].destroy();
    }
    const chartElement = document.getElementById(
      `barChart_${horseId}`
    ) as HTMLCanvasElement;
    this.barCharts[horseId] = new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: [
          Gait.toString(Gait.Walk),
          Gait.toString(Gait.Trot),
          Gait.toString(Gait.Lope),
          Gait.toString(Gait.Gallop)
        ],
        datasets: [
          {
            label: 'Minutes',
            data: [0, 0, 0, 0],
            backgroundColor: BLUE_COLOR, // array should have same number of elements as number of dataset
            borderColor: BLUE_COLOR, // array should have same number of elements as number of dataset
            borderWidth: 1
          },
          {
            label: 'Miles',
            data: [0, 0, 0, 0],
            backgroundColor: RED_COLOR, // array should have same number of elements as number of dataset
            borderColor: RED_COLOR, // array should have same number of elements as number of dataset
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 10
            },
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: true
            }
          }
        }
      }
    });
  }

  private _updateGaitProfileChart(
    horseId: string,
    totalMinutesPerGait: GaitNumbers,
    totalDistancePerGait: GaitNumbers
  ): void {
    if (this.barCharts[horseId] && this.barCharts[horseId].data) {
      this.barCharts[horseId].data.datasets[0].data = [
        totalMinutesPerGait[Gait.Walk],
        totalMinutesPerGait[Gait.Trot],
        totalMinutesPerGait[Gait.Lope],
        totalMinutesPerGait[Gait.Gallop]
      ];
      this.barCharts[horseId].data.datasets[1].data = [
        totalDistancePerGait[Gait.Walk],
        totalDistancePerGait[Gait.Trot],
        totalDistancePerGait[Gait.Lope],
        totalDistancePerGait[Gait.Gallop]
      ];
      this.barCharts[horseId].update();
    }
  }

  public onNextGaitProfile(): void {
    const selectedHorse = this.selectedHorse$.getValue();
    this.ride$
      .pipe(
        take(1),
        tap((ride) => {
          if (ride.horseIdentities.length - 1 > selectedHorse) {
            this.selectedHorse$.next(selectedHorse + 1);
          } else {
            this.selectedHorse$.next(0);
          }
        })
      )
      .subscribe();
  }

  public onPreviousGaitProfile(): void {
    const selectedHorse = this.selectedHorse$.getValue();
    this.ride$
      .pipe(
        take(1),
        tap((ride) => {
          if (selectedHorse > 0) {
            this.selectedHorse$.next(selectedHorse - 1);
          } else {
            this.selectedHorse$.next(ride.horseIdentities.length - 1);
          }
        })
      )
      .subscribe();
  }

  public onFocusGaitChange(): void {
    if (this._hasFocusFirstTime$.getValue()) {
      return;
    }
    this._modalService
      .openActionDialog(
        'Warning',
        `Changing these values will allow the ride to be included in the ride history, but the ride will be noted as a manually entered ride,
             and the ride will not be included in the horse-profile analytics.
            These changes will not take effect unless the "save" button in this component is pressed.  To revert to the recorded timings, click "reset".`,
        'Okay'
      )
      .afterClosed()
      .pipe(
        take(1),
        tap(() => {
          this._hasFocusFirstTime$.next(true);
        })
      )
      .subscribe();
  }

  public lastWayPoint(ride: Ride): GeoPoint | null {
    const lastPath = ride.paths[ride.paths.length - 1];
    if (!lastPath) {
      return null;
    }

    return lastPath.wayPoints[lastPath.wayPoints.length - 1];
  }
}
