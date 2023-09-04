import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    OnDestroy,
    ViewChild,
    ElementRef,
    LOCALE_ID,
    Inject
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// eslint-disable-next-line
import {
    HorseProfile,
    HorseBreed,
    HorsePermission,
    HorseProfileStatus,
    HorseRelationshipsSimple,
    HorseStatTotals,
    kilometersToMiles,
    MAX_PINNED_IMAGES,
    Media,
    minutesToHours,
    Gait,
    GaitNumbers,
    BLUE_COLOR,
    RED_COLOR,
    AppHorseDetail,
    milesToKilometers,
    GaitDetailTab,
    Privacy,
    Invitation,
    kgToLbs,
    meterToHands,
    GalleryService,
    HorseService,
    handsToMeter,
    lbsToKg,
    RED_COLOR_ALPHA,
    MediaDocumentType,
    Horse
} from '@caballus/ui-common';

import { HorseCache, InvitationCache, MediaCache } from '@ion-caballus/core/caches';
import { ToastService } from '@rfx/ngx-toast';
import {
    BehaviorSubject,
    iif,
    Observable,
    of,
    combineLatest,
    from,
    Subject,
    throwError
} from 'rxjs';
import {
    catchError,
    map,
    shareReplay,
    switchMap,
    take,
    tap,
    filter,
    takeUntil,
    withLatestFrom,
    finalize
} from 'rxjs/operators';
import { ModalService } from '@ion-caballus/core/services';
import { Chart } from 'chart.js';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { formatNumber, Location } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { environment } from '@ion-caballus/env';
import { Select } from '@ngxs/store';
import { UserState } from '@ion-caballus/state';

const DigitsInfo = '1.2-2';
const AverageBeforeLimit = 4;
const AverageAfterLimit = 5;

export class DistancePerRide {
    public date: string;
    public mile: number;
    public average: number;
}

@Component({
    selector: 'app-general-horse-detail',
    templateUrl: './general-horse-detail.component.html',
    styleUrls: ['./general-horse-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralHorseDetailComponent implements OnInit, OnDestroy {
    @Select(UserState.doesUserHaveActiveSubscription)
    public doesUserHaveActiveSubscription$!: Observable<boolean>;

    private _onDestroy$: Subject<void> = new Subject<void>();
    public readonly HorseBreed: typeof HorseBreed = HorseBreed;
    public HorseProfileStatus: typeof HorseProfileStatus = HorseProfileStatus;
    public readonly MediaDocumentType: typeof MediaDocumentType = MediaDocumentType;
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly minutesToHours: (k: number) => number = minutesToHours;
    public readonly kgToLbs: (k: number) => number = kgToLbs;
    public readonly meterToHands: (k: number) => number = meterToHands;
    public canEdit$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public canTransfer$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public canEnable$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public canInvite$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public canDelete$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    private _isProfileShared$: Observable<boolean> = this._activatedRoute.queryParams.pipe(
        map(params => !!params.shared),
        shareReplay(1)
    );
    public horse$: BehaviorSubject<Horse> = new BehaviorSubject(null);
    public horseStatsAndRelationships$: Observable<HorseRelationshipsSimple & HorseStatTotals> =
        this._horseId$.pipe(
            take(1),
            switchMap(id =>
                iif(
                    () => !!id,
                    combineLatest([
                        from(this._horseCache.getHorseRelationships(id)),
                        from(this._horseCache.getHorseStatTotals(id)),
                        from(
                            this._invitationCache.getInvitationDetailedListByHorseId(id, true, true)
                        )
                    ]).pipe(take(1)),
                    of(null)
                )
            ),
            map(([relationship, statTotals, invitations]) => {
                const hasValidRelationship: boolean =
                    relationship && !!relationship.loggedInUserRole;
                this.canEdit$.next(
                    hasValidRelationship
                        ? !!relationship.loggedInUserRole.permissions.includes(
                              HorsePermission.HorseEdit
                          )
                        : false
                );
                this.canTransfer$.next(
                    hasValidRelationship
                        ? !!relationship.loggedInUserRole.permissions.includes(
                              HorsePermission.HorseTransferOwnership
                          )
                        : false
                );
                this.canEnable$.next(
                    hasValidRelationship
                        ? !!relationship.loggedInUserRole.permissions.includes(
                              HorsePermission.HorseEnable
                          )
                        : false
                );
                this.canInvite$.next(
                    hasValidRelationship
                        ? !!relationship.loggedInUserRole.permissions.includes(
                              HorsePermission.HorseInvite
                          )
                        : false
                );
                this.canDelete$.next(
                    hasValidRelationship
                        ? !!relationship.loggedInUserRole.permissions.includes(
                              HorsePermission.HorseDelete
                          )
                        : false
                );
                this.invitations$.next(invitations);
                this._updateGaitProfileChart(
                    statTotals.totalMinutesPerGait,
                    statTotals.totalDistancePerGait
                );
                return {
                    ...relationship,
                    ...statTotals
                };
            }),
            catchError(() => {
                this._toastService.error('Error getting relationship or total stats');
                return of(null);
            })
        );

    public horsePinnedImages$: BehaviorSubject<Media[]> = new BehaviorSubject([]);
    public horsePermissions$: Observable<HorsePermission[]>;
    public readonly AppHorseDetail: typeof AppHorseDetail = AppHorseDetail;
    public selectedMenuItem$: Observable<AppHorseDetail> = this._activatedRoute.data.pipe(
        map(data => data.selectedMenuItem),
        shareReplay(1)
    );
    @ViewChild('barChart') public barChartElement: ElementRef<HTMLCanvasElement>;
    public barChart: Chart;

    @ViewChild('rideChart') public rideChartElement: ElementRef<HTMLCanvasElement>;
    public rideChart: Chart;
    public dateRange: string[] = [
        '1 Month',
        '3 Months',
        '6 Months',
        '1 Year',
        'Lifetime',
        'Custom'
    ];
    public selectedRange: string = '1 Month';
    public startOfDateRange: Date;
    public endOfDateRange: Date;

    public readonly GaitDetailTab: typeof GaitDetailTab = GaitDetailTab;
    public gaitProfileType: GaitDetailTab = GaitDetailTab.PROFILE;
    public showBarChart: boolean = true;
    public Gait: typeof Gait = Gait;
    public gaitSettingPlaceholder: GaitNumbers = Gait.defaultKilometersPerHour();
    public gaitSettingForm: FormGroup = this._formBuilder.group({
        walk: ['', Validators.required],
        trot: ['', Validators.required],
        lope: ['', Validators.required],
        gallop: ['', Validators.required]
    });
    public isGaitLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public invitations$: BehaviorSubject<Invitation[]> = new BehaviorSubject([]);
    public horseBioForm: FormGroup = this._formBuilder.group({
        commonName: ['', Validators.required],
        registeredName: [''],
        breed: [''],
        registrationNumber: [''],
        weightKilograms: ['', Validators.required],
        heightMeters: ['', Validators.required]
    });

    public validations = {
        commonName: [{ type: 'required', message: 'Common Name is required.' }],
        heightMeters: [{ type: 'required', message: 'Height is required.' }],
        weightKilograms: [{ type: 'required', message: 'Weight is required.' }],
        breed: [{ type: 'required', message: 'Breed is required.' }]
        // other validations
    };
    public isEditableMode$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public hasEdit$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    private _refreshInvitations$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(queryParams => queryParams.get('refreshInvitations')),
        shareReplay(1)
    );
    public isHorseFollowed: boolean = false;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseCache: HorseCache,
        private readonly _mediaCache: MediaCache,
        private readonly _modalService: ModalService,
        private readonly _formBuilder: FormBuilder,
        private readonly _galleryService: GalleryService,
        @Inject(LOCALE_ID) private readonly _locale: string,
        private readonly _alertController: AlertController,
        private readonly _invitationCache: InvitationCache,
        private readonly _horseService: HorseService,
        private readonly _location: Location
    ) {}

    public previewHorseProfileImage(): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => this.openHorseProfileImage(id))
            )
            .subscribe();
    }

    private openHorseProfileImage(horseId: string): Observable<boolean> {
        return this._modalService.horseProfileImage(horseId).pipe(
            take(1),
            tap(flag => {
                if (flag) {
                    this.goToPhotoGallery('profile-image', !!horseId);
                }
            })
        );
    }

    public ngOnInit(): void {
        const today = new Date(new Date().toDateString());
        this.endOfDateRange = new Date(new Date().toDateString());
        this.startOfDateRange = new Date(today.setMonth(today.getMonth() - 1));
        this.isLoading$.next(true);
        this._horseId$
            .pipe(
                take(1),
                switchMap(horseId => this._horseService.isHorseFollowed(horseId)),
                tap(isHorseFollowed => {
                    this.isLoading$.next(false);
                    this.isHorseFollowed = isHorseFollowed;
                }),
                catchError(() => {
                    this.isLoading$.next(false);
                    this.isHorseFollowed = false;
                    return of(null);
                })
            )
            .subscribe();
    }

    public ionViewWillEnter(): void {
        this._getHorseProfile();
    }

    private _getHorseProfile(): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                tap(_ => this.getHorsePinnedMedia()),
                switchMap(id =>
                    iif(
                        () => !!id,
                        combineLatest([
                            from(this._horseCache.getHorseBasic(id)),
                            from(this._isProfileShared$)
                        ]).pipe(take(1)),
                        of(null)
                    )
                ),
                switchMap(([horse, isProfileShared]) =>
                    iif(
                        () =>
                            (isProfileShared &&
                                horse.profile.privacy.overallPrivacy === Privacy.Public) ||
                            !isProfileShared,
                        of(horse),
                        throwError(
                            'This horse is not public.  The horse must be made public before you can view it.'
                        )
                    )
                ),
                withLatestFrom(this.selectedMenuItem$),
                tap(([h, menuItem]) => {
                    if (!h) {
                        return this.backToHorseList();
                    }
                    this.horse$.next(h);
                    this.gaitSettingForm.patchValue({
                        walk: formatNumber(
                            kilometersToMiles(h.gaitsKilometersPerHour[Gait.Walk]),
                            this._locale,
                            DigitsInfo
                        ),
                        trot: formatNumber(
                            kilometersToMiles(h.gaitsKilometersPerHour[Gait.Trot]),
                            this._locale,
                            DigitsInfo
                        ),
                        lope: formatNumber(
                            kilometersToMiles(h.gaitsKilometersPerHour[Gait.Lope]),
                            this._locale,
                            DigitsInfo
                        ),
                        gallop: formatNumber(
                            kilometersToMiles(h.gaitsKilometersPerHour[Gait.Gallop]),
                            this._locale,
                            DigitsInfo
                        )
                    });

                    if (menuItem === AppHorseDetail.Analytics) {
                        this.barChart = new Chart(this.barChartElement.nativeElement, {
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
                                        label: 'Hours',
                                        data: [],
                                        backgroundColor: BLUE_COLOR, // array should have same number of elements as number of dataset
                                        borderColor: BLUE_COLOR, // array should have same number of elements as number of dataset
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'Miles',
                                        data: [],
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
                        this.rideChart = new Chart(this.rideChartElement.nativeElement, {
                            data: {
                                labels: [],
                                datasets: [
                                    {
                                        type: 'bar',
                                        // label: 'Hours',
                                        data: [],
                                        yAxisID: 'y',
                                        backgroundColor: BLUE_COLOR, // array should have same number of elements as number of dataset
                                        borderColor: BLUE_COLOR, // array should have same number of elements as number of dataset
                                        borderWidth: 1
                                    },
                                    {
                                        type: 'line',
                                        // label: 'Miles',
                                        data: [],
                                        fill: true,
                                        yAxisID: 'y1',
                                        backgroundColor: RED_COLOR_ALPHA, // array should have same number of elements as number of dataset
                                        borderColor: RED_COLOR, // array should have same number of elements as number of dataset
                                        borderWidth: 1
                                    }
                                ]
                            },
                            options: {
                                elements: {
                                    line: {
                                        tension: 0
                                    },
                                    point: {
                                        radius: 0
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                },
                                scales: {
                                    y: {
                                        type: 'linear',
                                        position: 'left',
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 2
                                        },
                                        grid: {
                                            display: true,
                                            lineWidth: 2
                                        }
                                    },
                                    y1: {
                                        type: 'linear',
                                        position: 'right',
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 2,
                                            color: RED_COLOR
                                        },
                                        grid: {
                                            display: false
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        }
                                    }
                                }
                            }
                        });
                    }
                }),
                tap(([h, menuItem]) => {
                    if (menuItem === AppHorseDetail.Analytics) {
                        this.updateRideChart(h._id, this.startOfDateRange, this.endOfDateRange);
                    }
                }),
                // eslint-disable-next-line
                catchError(async error => {
                    const alert = await this._alertController.create({
                        message: error || 'Error while getting horse profile',
                        buttons: ['OK']
                    });
                    await alert.present();
                    await alert.onDidDismiss();
                    this._router.navigateByUrl('/tabs/map-my-ride');
                    return of(null);
                })
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public updateRideChart(id: string, start: Date, end: Date): void {
        this._horseCache
            .getHorseDistancePerRide(id)
            .pipe(
                tap(result => {
                    // reset server result
                    const chartData: DistancePerRide[] = this._dataToChartData(result, start, end);
                    // set chart data
                    this.rideChart.data.labels = [];
                    this.rideChart.data.datasets[0].data = [];
                    this.rideChart.data.datasets[1].data = [];
                    chartData.forEach(r => {
                        this.rideChart.data.labels.push(r.date);
                        this.rideChart.data.datasets[0].data.push(kilometersToMiles(r.mile));
                        this.rideChart.data.datasets[1].data.push(kilometersToMiles(r.average));
                    });
                    this.rideChart.update();
                }),
                // eslint-disable-next-line
                catchError(async error => {
                    const alert = await this._alertController.create({
                        message: error || 'Error while getting horse Ride data',
                        buttons: ['OK']
                    });
                    await alert.present();
                    await alert.onDidDismiss();
                    return of(null);
                })
            )
            .subscribe();
    }

    private getHorsePinnedMedia(): void {
        this._horseId$
            .pipe(
                take(1),
                switchMap(id =>
                    iif(
                        () => !!id,
                        // this._mediaCache.getPinnedHorseMedia(id), of(null))),
                        this._galleryService.getPinnedMediaByHorseId(id),
                        of(null)
                    )
                ),
                map(photos => {
                    // Used here for because if pinned images less then 5 it will show + or blank icon in UI for unavailable images
                    if (photos?.length < MAX_PINNED_IMAGES) {
                        for (let i = photos.length; i < MAX_PINNED_IMAGES; i++) {
                            photos.push(new Media());
                        }
                    }
                    this.horsePinnedImages$.next(photos);
                }),
                catchError(() => {
                    this._toastService.error('Error getting pinned images');
                    return of([]);
                })
            )
            .subscribe();
    }

    private _dataToChartData(
        results: { date: Date; distanceKilometers: number }[],
        start: Date,
        end: Date
    ): DistancePerRide[] {
        const updatedData: { date: Date; distanceKilometers: number }[] = [];
        if (!!start && !!end) {
            results = results.filter(
                result =>
                    new Date(result.date).getTime() >= start.getTime() &&
                    new Date(result.date).getTime() < end.getTime()
            );
        }

        if (results.length > 0) {
            const firstData = new Date(results[0].date);
            const lastData = new Date(results[results.length - 1].date);
            const newArrayData: { date: Date; distanceKilometers: number }[] = [];
            // Remove time part
            for (let _i = 0; _i < results.length; _i++) {
                const date = new Date(results[_i].date);
                newArrayData.push({
                    date: new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
                    distanceKilometers: results[_i].distanceKilometers
                });
            }
            const startDate = new Date(
                firstData.getUTCFullYear(),
                firstData.getUTCMonth(),
                firstData.getUTCDate()
            );
            const lastDate = new Date(
                lastData.getUTCFullYear(),
                lastData.getUTCMonth(),
                lastData.getUTCDate()
            );
            let startOfLimitTime = startDate;
            let lastOfLimitTime = lastDate;
            if (!!start && !!end) {
                startOfLimitTime = start;
                lastOfLimitTime = end;
            }

            while (startOfLimitTime.getTime() <= lastOfLimitTime.getTime()) {
                const sameDateArray = newArrayData.filter(
                    d => d.date.getTime() === startOfLimitTime.getTime()
                );
                let mile = 0;
                sameDateArray.forEach(da => {
                    mile = mile + da.distanceKilometers;
                });
                if (sameDateArray.length > 0) {
                    mile = mile / sameDateArray.length;
                }
                updatedData.push({
                    date: new Date(startOfLimitTime),
                    distanceKilometers: mile
                });
                startOfLimitTime = new Date(
                    startOfLimitTime.setDate(startOfLimitTime.getDate() + 1)
                );
            }
        }
        return this._calAverage10(updatedData);
    }

    private _calAverage10(data: { date: Date; distanceKilometers: number }[]): DistancePerRide[] {
        const completedData: DistancePerRide[] = [];
        for (let i = 0; i < data.length; i++) {
            let before = 0;
            let after = 1;
            let count = 0;
            let sum = 0.0;
            while (before <= AverageBeforeLimit) {
                if (i - before >= 0) {
                    sum = sum + data[i - before].distanceKilometers;
                    count++;
                }
                before++;
            }
            while (after <= AverageAfterLimit) {
                if (i + after < data.length) {
                    sum = sum + data[i + after].distanceKilometers;
                    count++;
                }
                after++;
            }
            completedData.push({
                date:
                    data[i].date.getMonth() +
                    1 +
                    '/' +
                    data[i].date.getDate() +
                    '/' +
                    data[i].date.getFullYear(),
                mile: data[i].distanceKilometers,
                average: sum / count
            });
        }
        return completedData;
    }

    public onChangeDate(): void {
        const today = new Date(new Date().toDateString());
        switch (this.selectedRange) {
            case '1 Month':
                this.endOfDateRange = new Date(new Date().toDateString());
                this.startOfDateRange = new Date(today.setMonth(today.getMonth() - 1));
                break;
            case '3 Months':
                this.endOfDateRange = new Date(new Date().toDateString());
                // eslint-disable-next-line no-magic-numbers
                this.startOfDateRange = new Date(today.setMonth(today.getMonth() - 3));
                break;
            case '6 Months':
                this.endOfDateRange = new Date(new Date().toDateString());
                // eslint-disable-next-line no-magic-numbers
                this.startOfDateRange = new Date(today.setMonth(today.getMonth() - 6));
                break;
            case '1 Year':
                this.endOfDateRange = new Date(new Date().toDateString());
                this.startOfDateRange = new Date(today.setFullYear(today.getFullYear() - 1));
                break;
            case 'Lifetime':
                this.endOfDateRange = null;
                this.startOfDateRange = null;
                break;
            case 'Custom':
                this.endOfDateRange = null;
                this.startOfDateRange = null;
                return;
            default:
                this.endOfDateRange = new Date(new Date().toDateString());
                this.startOfDateRange = new Date(today.setMonth(today.getMonth() - 1));
                break;
        }
        this._horseId$.subscribe(id => {
            this.updateRideChart(id, this.startOfDateRange, this.endOfDateRange);
        });
    }

    public addFromEvent(event: any): void {
        if (!!event.value) {
            this.startOfDateRange = event.value;
        }
    }

    public addToEvent(event: any): void {
        if (!!event.value) {
            this.endOfDateRange = event.value;
        }
    }

    public async addCustomRange(): Promise<void> {
        if (!this.startOfDateRange || !this.endOfDateRange) {
            this._toastService.info(
                'Please select a date for the beginning and end of the desired range.'
            );
            return;
        }
        if (this.startOfDateRange.getTime() > this.endOfDateRange.getTime()) {
            const alert = await this._alertController.create({
                message: 'Error: To date is before the From date.',
                buttons: ['OK']
            });
            await alert.present();
            await alert.onDidDismiss();
            return;
        }
        this._horseId$.subscribe(id => {
            this.updateRideChart(id, this.startOfDateRange, this.endOfDateRange);
        });
    }

    public backToHorseList(): void {
        const locationState = this._location.getState() as Record<string, any>;
        const { returnTo } = locationState;

        this.hasEdit$
            .pipe(
                take(1),
                tap(hasEdit => {
                    if (returnTo) {
                        this._router.navigateByUrl(returnTo);
                    } else {
                        this._router.navigateByUrl('/tabs/horse-profile?doRefresh=' + hasEdit);
                    }
                })
            )
            .subscribe();
    }

    public deleteHorse(): void {
        this._modalService
            .deleteHorse(this.horse$.getValue()._id)
            .pipe(
                tap(({ deleted }: { deleted?: boolean }) => {
                    if (deleted) {
                        this._router.navigate(['/tabs/horse-profile'], {
                            queryParams: {
                                doRefresh: true
                            }
                        });
                    }
                })
            )
            .subscribe();
    }

    public disableEnableHorse(): void {
        this.horse$
            .pipe(
                take(1),
                filter(h => !!h),
                switchMap(h =>
                    this._modalService
                        .disableEnableHorse(h._id, h.profile?.profileStatus)
                        .pipe(map(result => ({ result, h })))
                ),
                tap(
                    (v: {
                        result: {
                            confirm: boolean;
                            profileStatus?: HorseProfileStatus;
                        };
                        h: Horse;
                    }) => {
                        if (v.result.confirm) {
                            this.horse$.next(
                                new Horse({
                                    ...v.h,
                                    profile: new HorseProfile({
                                        ...v.h.profile,
                                        profileStatus: v.result.profileStatus
                                    })
                                })
                            );
                        }
                    }
                )
            )
            .subscribe();
    }

    public transferHorse(): void {
        this._router.navigate(
            [`/tabs/horse-profile/detail-horse/transfer-horse/${this.horse$.getValue()}`],
            {
                state: {
                    horse: this.horse$.getValue(),
                    cancelTransferModal: false,
                    invitations: []
                }
            }
        );
    }

    public cancelTransferHorse(): void {
        this._router.navigate(
            [`/tabs/horse-profile/detail-horse/transfer-horse/${this.horse$.getValue()}`],
            {
                state: {
                    horse: this.horse$.getValue(),
                    cancelTransferModal: true,
                    invitations: this.invitations$.getValue()
                }
            }
        );
    }

    public selectTab(el): void {
        const type = el.value as GaitDetailTab;
        this.showBarChart = type !== GaitDetailTab.PROFILE;
        this.gaitProfileType = type;
    }

    public goToInvitesAndPermissions(): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id =>
                    this._router.navigateByUrl(
                        `/tabs/horse-profile/detail-horse/invites-permissions/${id}`
                    )
                )
            )
            .subscribe();
    }

    public goToPhotoGallery(flow?: string, shouldOpen?: boolean): void {
        if (shouldOpen) {
            this._horseId$
                .pipe(
                    take(1),
                    filter(id => !!id),
                    switchMap(id =>
                        this._router.navigateByUrl(
                            `/tabs/horse-profile/detail-horse/horse-photo-gallery/${id}/${flow}`
                        )
                    )
                )
                .subscribe();
        }
    }

    public onGaitSettingSave(): void {
        if (this.gaitSettingForm.invalid) {
            return;
        }
        this.isGaitLoading$.next(true);
        this._horseId$
            .pipe(
                take(1),
                switchMap(id =>
                    this._horseCache.editHorseGaits(id, {
                        [Gait.Gallop]: milesToKilometers(this.gaitSettingForm.value.gallop),
                        [Gait.Walk]: milesToKilometers(this.gaitSettingForm.value.walk),
                        [Gait.Trot]: milesToKilometers(this.gaitSettingForm.value.trot),
                        [Gait.Lope]: milesToKilometers(this.gaitSettingForm.value.lope),
                        [Gait.None]: this.horse$.getValue().gaitsKilometersPerHour[Gait.None]
                    })
                ),
                tap(() => {
                    this._toastService.success('Setting has been saved');
                    this.isGaitLoading$.next(false);
                    this.horseStatsAndRelationships$.pipe(take(1)).subscribe();
                }),
                catchError(error => {
                    this._toastService.error(
                        error?.error?.message || 'Error while saving horse gait setting'
                    );
                    this.isGaitLoading$.next(false);
                    return of(null);
                })
            )
            .subscribe();
    }

    public onGaitReset(): void {
        const defaultSetting = Gait.defaultKilometersPerHour();
        this.gaitSettingForm.patchValue({
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
        this.onGaitSettingSave();
    }

    private _updateGaitProfileChart(
        totalMinutesPerGait: GaitNumbers,
        totalDistancePerGait: GaitNumbers
    ): void {
        if (this.barChart && this.barChart.data) {
            this.barChart.data.datasets[0].data = [
                totalMinutesPerGait[Gait.Walk],
                totalMinutesPerGait[Gait.Trot],
                totalMinutesPerGait[Gait.Lope],
                totalMinutesPerGait[Gait.Gallop]
            ];
            this.barChart.data.datasets[1].data = [
                totalDistancePerGait[Gait.Walk],
                totalDistancePerGait[Gait.Trot],
                totalDistancePerGait[Gait.Lope],
                totalDistancePerGait[Gait.Gallop]
            ];
            this.barChart.update();
        }
    }

    public onShare(): void {
        this._horseId$
            .pipe(
                take(1),
                switchMap(id =>
                    iif(
                        () => !!id,
                        combineLatest([
                            from(this.horse$),
                            from(this._horseCache.getHorseStatTotals(id))
                        ]).pipe(take(1)),
                        of(null)
                    )
                ),
                tap(([horse, horseStats]) => {
                    const title = `Caballus Horse profile for ${
                        horse.profile.registeredName || horse.profile.commonName
                    }`;
                    const totalDistanceMiles = kilometersToMiles(
                        horseStats?.totalDistanceKilometers
                    );
                    const formattedTotalDistance = formatNumber(
                        totalDistanceMiles,
                        this._locale,
                        DigitsInfo
                    );
                    const deeplink = `${environment.ionBaseUrl}/tabs/horse-profile/detail-horse/general-tab/${horse._id}?shared=true`;
                    const text = [
                        `${horse?.profile?.profilePicture?.url || ''}`,
                        title,
                        `\u2022 Horse Name: ${horse.profile.commonName}`,
                        `\u2022 Breed Name: ${horse.profile.breed || ''}`,
                        `\u2022 Total Caballus Distance: ${formattedTotalDistance}`,
                        `\u2022 Number of Total Rides: ${horseStats?.totalRides}`,
                        `\u2022 Last 3 Rides: ${horseStats?.riderNames.toString()}`,
                        `Link:`
                    ].join('\n');
                    Share.share({
                        title,
                        text,
                        url: deeplink,
                        dialogTitle: title
                    });
                }),
                catchError(() => {
                    this._toastService.error('Error while sharing horse profile');
                    return of(null);
                })
            )
            .subscribe();
    }

    public onEdit(): void {
        const isEditableMode = this.isEditableMode$.getValue();
        if (isEditableMode) {
            this.isEditableMode$.next(false);
            return;
        }
        const horse = this.horse$.getValue();
        this.horseBioForm.patchValue({
            ...horse.profile,
            weightKilograms: formatNumber(
                kgToLbs(horse.profile.weightKilograms),
                this._locale,
                DigitsInfo
            ),
            heightMeters: formatNumber(
                meterToHands(horse.profile.heightMeters),
                this._locale,
                DigitsInfo
            )
        });
        this.isEditableMode$.next(true);
    }

    public onBioEdit(): void {
        if (this.horseBioForm.invalid) {
            return;
        }
        this.isLoading$.next(true);
        const horseProfile = {
            ...this.horseBioForm.value,
            ...{
                weightKilograms: lbsToKg(this.horseBioForm.value.weightKilograms),
                heightMeters: handsToMeter(this.horseBioForm.value.heightMeters)
            }
        };
        this._horseId$
            .pipe(
                take(1),
                switchMap(horseId =>
                    this._horseService.editHorseBio({
                        ...horseProfile,
                        id: horseId
                    })
                ),
                tap(() => {
                    this.hasEdit$.next(true);
                    this.onBioCancel(horseProfile);
                }),
                catchError(() => {
                    this._toastService.error('Error updating horse bio');
                    return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
            )
            .subscribe();
    }

    public onBioCancel(newHorseProfile?: HorseProfile): void {
        if (newHorseProfile) {
            const horse = this.horse$.getValue();
            horse.profile.commonName = newHorseProfile.commonName;
            horse.profile.registeredName = newHorseProfile.registeredName;
            horse.profile.breed = newHorseProfile.breed;
            horse.profile.registrationNumber = newHorseProfile.registrationNumber;
            horse.profile.weightKilograms = newHorseProfile.weightKilograms;
            horse.profile.heightMeters = newHorseProfile.heightMeters;
            this.horse$.next(horse);
        }
        this.isEditableMode$.next(false);
    }

    public imageViewerModal(attachmentUrl: string, mediaId: string): void {
        if (!attachmentUrl) {
            this.goToPhotoGallery('pin-media', true);
            return;
        }
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => this.openModal(attachmentUrl, mediaId, id))
            )
            .subscribe();
    }

    public async openModal(attachmentUrl: string, mediaId: string, horseId: string): Promise<void> {
        this._modalService
            .imageViewerModal(attachmentUrl, mediaId, horseId, true)
            .pipe(
                take(1),
                tap(() => this.getHorsePinnedMedia())
            )
            .subscribe();
    }

    public ionViewDidEnter(): void {
        this._refreshInvitations$
            .pipe(
                switchMap(refreshInvitations =>
                    iif(
                        () => !!refreshInvitations && !!this.horse$.getValue()?._id,
                        this._invitationCache.getInvitationDetailedListByHorseId(
                            this.horse$.getValue()?._id,
                            true,
                            true
                        ),
                        of(null)
                    )
                ),
                tap(invitations => {
                    if (invitations) {
                        this.invitations$.next(invitations);
                    }
                })
            )
            .subscribe();
    }

    public async changeFollowCheckBox(isHorseFollowed: boolean): Promise<void> {
        this.isLoading$.next(true);
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => this._horseService.followUnfollowHorse(id)),
                tap(async () => {
                    this.isLoading$.next(false);
                }),
                catchError(() => {
                    this.isLoading$.next(false);
                    this.isHorseFollowed = !this.isHorseFollowed;
                    this._toastService.error('Error following to horse');
                    return of(null);
                })
            )
            .subscribe();
        const message = isHorseFollowed
            ? 'You will hereafter be notified when this horse has some activity'
            : 'You will no longer be notified when this horse has some activity';
        const alert = await this._alertController.create({
            message,
            buttons: ['OK']
        });
        alert.present();
    }
}
