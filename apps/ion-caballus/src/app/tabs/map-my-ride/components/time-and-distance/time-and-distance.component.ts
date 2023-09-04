import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
    AppRideStatus,
    getRideKilometers,
    kilometersToMiles,
    ModalService,
    Ride,
    milesToKilometers,
    calculateRideTime
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import * as moment from 'moment';
import { interval, Observable, of, Subject } from 'rxjs';
import {
    map,
    switchMap,
    take,
    takeUntil,
    tap,
    filter,
    withLatestFrom,
    shareReplay
} from 'rxjs/operators';
import _ from 'lodash';
import { RideState } from '@ion-caballus/core/state';
import { Select } from '@ngxs/store';
import { Emittable, Emitter } from '@ngxs-labs/emitter';

function parseDuration(durationString: string): number {
    return moment.duration(durationString, 'milliseconds').asMilliseconds();
}

@Component({
    selector: 'app-time-and-distance',
    templateUrl: './time-and-distance.component.html',
    styleUrls: ['./time-and-distance.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeAndDistanceComponent implements OnInit {
    @Select(RideState)
    public readonly ride$!: Observable<Ride | null>;

    @Emitter(RideState.manualDuration)
    public readonly manualDuration!: Emittable<number>;
    @Emitter(RideState.manualDistance)
    public readonly manualDistance!: Emittable<number>;

    public rideDuration$!: Observable<number>;
    public rideDistance$!: Observable<number>;
    public isRideCompleted$!: Observable<boolean>;
    public rideStatus$!: Observable<AppRideStatus | null>;

    public ngOnInit() {
        // TODO make this a bit more efficient/not run endlessly
        this.rideDuration$ = interval(1000).pipe(
            withLatestFrom(this.ride$),
            filter(([_, ride]) => !ride || ride.appRideStatus !== AppRideStatus.Paused),
            map(([_, ride]) => {
                if (!ride) {
                    return 0;
                }

                return calculateRideTime(ride);
            }),
            shareReplay(1)
        );
        this.rideDistance$ = this.ride$.pipe(
            map(ride => {
                if (!ride) {
                    return 0;
                }

                const distance = getRideKilometers(ride);
                const asMiles = kilometersToMiles(distance);

                return asMiles;
            }),
            shareReplay(1)
        );
        this.isRideCompleted$ = this.ride$.pipe(
            map(ride => ride?.appRideStatus === AppRideStatus.EndRideDetails),
            shareReplay(1)
        );
        this.rideStatus$ = this.ride$.pipe(
            takeUntil(this._onDestroy$),
            map(ride => ride?.appRideStatus)
        );
    }

    private _onDestroy$: Subject<void> = new Subject();
    private _manualEntryMessageShown: boolean = false;

    constructor(
        private readonly _modalService: ModalService,
        private readonly _toastService: ToastService
    ) {}

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public showDurationEdit(): void {
        this.showManualEntryInfo()
            .pipe(
                switchMap(() => this.rideDuration$.pipe(take(1))),
                map(duration => this.formatDuration(duration)),
                switchMap(duration => this._modalService.rideDuration(duration).afterClosed()),
                map(modalResult => {
                    if (modalResult?.changed) {
                        const newValue = modalResult.duration;
                        this.manualDuration.emit(parseDuration(newValue));

                        this._toastService.info(
                            'New Duration is saved. Ride will be marked a manual entry.'
                        );
                    } else if (modalResult?.reset) {
                        // TODO ridestate emitter or something for resetting to
                        // original non-manual value
                    } else {
                        return this._toastService.info('No changes made');
                    }
                })
            )
            .subscribe();
    }
    public showDistanceEdit(): void {
        this.showManualEntryInfo()
            .pipe(
                switchMap(() => this.rideDistance$.pipe(take(1))),
                switchMap(distance => this._modalService.rideDistance(distance).afterClosed()),
                map(modalResult => {
                    if (modalResult?.changed) {
                        const distance = Number(modalResult.distance);
                        this.manualDistance.emit(milesToKilometers(distance));

                        this._toastService.info(
                            'New Distance is saved. Ride is marked a manual entry.'
                        );
                    } else if (modalResult?.reset) {
                        // TODO ridestate emitter or something for resetting to
                        // original non-manual value
                    } else {
                        this._toastService.info('No changes made');
                    }
                })
            )
            .subscribe();
    }

    public showManualEntryInfo(): Observable<void> {
        if (this._manualEntryMessageShown) {
            return of(undefined);
        }
        return this._modalService
            .message(
                undefined,
                'Altering time or distance will flag the ride as a manual entry. ' +
                    'The ride will be visible in the history, but the data will ' +
                    'not be included in the horse profile statistics or charts.',
                'Ok'
            )
            .afterClosed()
            .pipe(
                tap(() => {
                    this._manualEntryMessageShown = true;
                })
            );
    }

    public formatDuration(duration: number): string {
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
}
