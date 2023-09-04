import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';
import { Router } from '@angular/router';
import {
    BLUE_COLOR,
    Gait,
    GaitDetailTab,
    GaitNumbers,
    HorseService,
    kilometersToMiles,
    Media,
    MediaDocumentType,
    metersToFeet,
    RED_COLOR,
    RideCategory,
    RideHistorySimple,
    WayPoint
} from '@caballus/ui-common';
import { BehaviorSubject, combineLatest, Observable, Subject, timer } from 'rxjs';
import { delay, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';
import { ModalService } from '@ion-caballus/core/services';
import { Chart } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { chain, flatMap } from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { Location } from '@angular/common';

function* pairWise<T>(input: Iterable<T>): Generator<[T, T]> {
    const iterator = input[Symbol.iterator]();
    let current = iterator.next();
    if (current.done) {
        return;
    }

    let next = iterator.next();
    while (!next.done) {
        yield [current.value, next.value];

        current = next;
        next = iterator.next();
    }
}

const GraphDomTimeout = 3000;

@Component({
    selector: 'app-ride-detail',
    templateUrl: './ride-detail.component.html',
    styleUrls: ['./ride-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideDetailComponent implements OnInit {
    private _onDestroy$: Subject<void> = new Subject<void>();
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly RideCategory: typeof RideCategory = RideCategory;
    public ride$: BehaviorSubject<any> = new BehaviorSubject(null);

    @Input() public horseId$: Observable<string>;
    @Input() public rideId$: Observable<string>;
    @Input() public ride: any;
    @Input() public backFlag = '';

    @Input() public viaShare = false;
    @Input() public wayPoints: WayPoint[] | null;
    public wayPoints$: BehaviorSubject<WayPoint[] | null> = new BehaviorSubject(null);

    @Input() public parentBack?: boolean = false;

    @Output()
    public backFromParent: EventEmitter<void> = new EventEmitter();

    public horseNames$: BehaviorSubject<string[]> = new BehaviorSubject([]);
    public states: { key: string; name: string }[] = State.members.map(t => ({
        key: t,
        name: State.toString(t)
    }));
    public showChart = false;
    public speed$: BehaviorSubject<{
        avgSpeed: number;
        maxSpeed: number;
    }> = new BehaviorSubject({
        avgSpeed: 0,
        maxSpeed: 0
    });
    public readonly GaitDetailTab: typeof GaitDetailTab = GaitDetailTab;
    public gaitProfileType: GaitDetailTab = GaitDetailTab.PROFILE;
    public Gait: typeof Gait = Gait;
    public totalMinutes$: BehaviorSubject<Record<string, number>> = new BehaviorSubject({});
    public selectedHorse$: BehaviorSubject<number> = new BehaviorSubject(0);
    public barCharts: Record<string, Chart> = {};
    public gaitKilometersStats$!: Observable<Record<string, GaitNumbers>>;
    public gaitMinutesStats$!: Observable<Record<string, GaitNumbers>>;
    public rideDurationStats$!: Observable<Record<string, number>>;
    public elevationGain$: BehaviorSubject<{
        lowest: number;
        highest: number;
        accumulative: number;
    }> = new BehaviorSubject(null);
    public MediaDocumentType: typeof MediaDocumentType = MediaDocumentType;
    public formattedTimes$: BehaviorSubject<Record<number, Record<string, number>>> =
        new BehaviorSubject({});

    constructor(
        private readonly _router: Router,
        private readonly _horseService: HorseService,
        private readonly _modalService: ModalService,
        private readonly _sanitizer: DomSanitizer,
        private readonly _location: Location
    ) {}

    public ngOnInit(): void {
        if (!this.ride) {
            combineLatest([this.horseId$, this.rideId$])
                .pipe(
                    take(1),
                    switchMap(([horseId, rideId]) => this._horseService.rideById(horseId, rideId)),
                    tap(ride => {
                        this._setRide(ride);
                        console.log(ride);
                    })
                )
                .subscribe(data => {
                    console.log(data);
                });
        } else {
            const ride = new RideHistorySimple(this.ride);
            this._setRide(ride);
        }
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public goBack(): void {
        const { returnToRideHistory } = this._location.getState() as Record<string, any>;
        if (returnToRideHistory) {
            this._location.back();
        } else {
            this.horseId$
                .pipe(
                    tap(horseId => {
                        this._router.navigate([
                            `/tabs/horse-profile/detail-horse/ride-history/${horseId}`
                        ]);
                    })
                )
                .subscribe();
        }
    }

    public async openVideoModal(media: Media): Promise<void> {
        this._modalService
            .mediaPreview('Ride Media', media.latest.url, true, media.latest.jwPlayerId, '')
            .subscribe();
    }

    public selectTab(element): void {
        this.gaitProfileType = element.value as GaitDetailTab;
    }

    public onNextGaitProfile(): void {
        const selectedHorse = this.selectedHorse$.getValue();
        this.ride$
            .pipe(
                take(1),
                tap(ride => {
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
                tap(ride => {
                    if (selectedHorse > 0) {
                        this.selectedHorse$.next(selectedHorse - 1);
                    } else {
                        this.selectedHorse$.next(ride.horseIdentities.length - 1);
                    }
                })
            )
            .subscribe();
    }

    private _setRide(r): void {
        const ride = new RideHistorySimple(r);

        // const wayPoints = flatMap(ride.paths, "wayPoints") as WayPoint[];
        // const centerPoint = getCenterpoint(wayPoints, false);
        // if (calculateRideTime(ride) < MINIMUM_RIDE_DURATION || !centerPoint?.latitude || !centerPoint?.longitude) {
        //     this._ionModalService
        //         .deleteIncompleteRide(r._id)
        //         .pipe(
        //             switchMap(() => this.horseId$),
        //             tap((horseId) => {
        //                 this._router.navigate([
        //                     `/tabs/horse-profile/detail-horse/ride-history/${horseId}`
        //                 ], {
        //                     state: {
        //                         isRefresh: true
        //                     }
        //                 });
        //                 this._toastService.info('Ride deleted');
        //             })
        //         )
        //         .subscribe();
        // } else {

        if (ride && ride.medias.length) {
            ride.medias = ride.medias.map(media => {
                if (media.thumbnail && media.thumbnail.url) {
                    media.thumbnail.safeUrl = this._sanitizer.bypassSecurityTrustResourceUrl(
                        media.thumbnail.url
                    );
                }
                return media;
            });
        }
        this.ride$.next(ride);
        this.horseNames$.next(ride.horseIdentities.map(({ label }) => label));

        const wayPoints = flatMap(ride.paths, path => path.wayPoints) as WayPoint[];
        this.wayPoints$.next(wayPoints);

        this.elevationGain$.next({
            lowest: metersToFeet(Math.min(...wayPoints.map(wayPoint => wayPoint.altitude))),
            highest: metersToFeet(Math.max(...wayPoints.map(wayPoint => wayPoint.altitude))),
            accumulative: this._elevation(wayPoints)
        });

        this.horseId$
            .pipe(
                take(1),
                delay(2000),
                tap(horseId => {
                    this.gaitKilometersStats$ = this.ride$.pipe(
                        map(ride =>
                            chain(ride.calculatedGaitKilometers)
                                .keyBy('horseId')
                                .mapValues('metrics')
                                .value()
                        ),
                        shareReplay(1)
                    );
                    this.gaitMinutesStats$ = this.ride$.pipe(
                        map(ride => {
                            ride.calculatedGaitMinutes.forEach(element => {
                                // create object to hold formatted gait minutes
                                //pull off the properties and values from the metrics object
                                const gaitMinutesObject = {};
                                const keys = Object.keys(element.metrics);
                                const values = Object.values(element.metrics) as number[];
                                const formattedGaitMinutesObject = {
                                    [horseId]: {}
                                };
                                // iterate over values and format them replace decimal with colon
                                // properly set the formatted values to their corresponding keys
                                values.forEach((value: number, index) => {
                                    const roundedValueString = value.toFixed(2);
                                    const formattedStringValue = roundedValueString
                                        .split('.')
                                        .join(':');
                                    gaitMinutesObject[keys[index]] = formattedStringValue;
                                });
                                // set the formatted gait minutes object to the new formattedGaitMinutesObject
                                // set it to the formattedTimes$ subject
                                formattedGaitMinutesObject[horseId] = gaitMinutesObject;
                                this.formattedTimes$.next(formattedGaitMinutesObject);
                            });
                            return chain(ride.calculatedGaitMinutes)
                                .keyBy('horseId')
                                .mapValues('metrics')
                                .value();
                        }),
                        shareReplay(1)
                    );
                    this.gaitMinutesStats$.subscribe(data => {
                        console.log(data);
                    });
                    this.rideDurationStats$ = this.ride$.pipe(
                        map(ride =>
                            chain(ride.horseIdentities)
                                .keyBy('_id')
                                .mapValues(horse => ride.totalMinutesForHorse(horse._id))
                                .value()
                        ),
                        shareReplay(1)
                    );
                    const totalMinutes = ride.horseIdentities.reduce((t, { _id }) => {
                        if (!t[_id]) {
                            t[_id] = this._formatDuration(ride.totalMinutesForHorse(_id));
                        }
                        return t;
                    }, {});
                    this.totalMinutes$.next(totalMinutes);
                    ride.horseIdentities.forEach(({ _id }) => {
                        timer(GraphDomTimeout).subscribe(() => {
                            const calculatedGaitMinutes = ride.calculatedGaitMinutes.find(
                                item => item.horseId === _id
                            )?.metrics;
                            const calculatedGaitKilometers = ride.calculatedGaitKilometers.find(
                                item => item.horseId === _id
                            )?.metrics;
                            this._createGaitCharts(_id);
                            if (calculatedGaitMinutes && calculatedGaitKilometers) {
                                this._updateGaitProfileChart(
                                    _id,
                                    calculatedGaitMinutes,
                                    calculatedGaitKilometers
                                );
                            }
                            if (!this.viaShare) {
                                this.selectedHorse$.next(
                                    ride.horseIdentities.findIndex(({ _id }) => horseId === _id)
                                );
                            }
                        });
                    });
                })
            )
            .subscribe();
        // }
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

    public _elevation(wayPoints: WayPoint[]): number {
        let total = 0;

        for (const [current, next] of pairWise(wayPoints)) {
            const difference = next.altitude - current.altitude;

            // Only summing up positive elevation change. That is if a horse
            // goes up a hill and then down the hill it should count that
            // elevation instead of zeroing out.
            if (difference > 0) {
                total += difference;
            }
        }

        return metersToFeet(total);
    }

    private _formatDuration(duration: number): string {
        duration = duration * 60 * 1000;
        const seconds = Math.floor((duration / 1000) % 60)
            .toString()
            .padStart(2, '0');

        const minutes = Math.floor((duration / 1000 / 60) % 60)
            .toString()
            .padStart(2, '0');

        const hours = Math.floor((duration / 1000 / 60 / 60) % 24)
            .toString()
            .padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }

    private _createGaitCharts(horseId: string): void {
        if (this.barCharts[horseId]) {
            // destroy existing chart before re-rendering
            this.barCharts[horseId].destroy();
        }

        const chartElement = document.getElementById(`barChart_${horseId}`) as HTMLCanvasElement;
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
}
