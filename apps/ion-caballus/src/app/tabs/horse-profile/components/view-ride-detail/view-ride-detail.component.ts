import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    BLUE_COLOR,
    Gait,
    GaitDetailTab,
    HorseService,
    kilometersToMiles,
    metersToFeet,
    MINUTES_PER_HOUR,
    MS_PER_SECOND,
    RED_COLOR,
    Ride,
    RideCategory,
    RideHistorySimple,
    SECONDS_PER_MINUTE,
    wayPointPairStats,
    getRideKilometers
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, combineLatest, Observable, Subject, timer } from 'rxjs';
import { map, shareReplay, tap, take, switchMap, filter, delay } from 'rxjs/operators';


function calculateRideTime(ride: Ride): number {
    const startDateTime = new Date(ride.startDateTime);
    if (ride.endDateTime) {
        return new Date(ride.endDateTime).getTime() - startDateTime.getTime();
    }

    const initialDuration = 0;
    return ride.paths.reduce((total, path) => {
        const endDate = (path.endDateTime && new Date(path.endDateTime)) || new Date();
        const pathDuration = endDate.getTime() - new Date(path.startDateTime).getTime();

        return total + pathDuration;
    }, initialDuration);
}

@Component({
    selector: 'app-view-ride-detail',
    templateUrl: './view-ride-detail.component.html',
    styleUrls: ['./view-ride-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewRideDetailComponent implements OnInit {
    private _onDestroy$: Subject<void> = new Subject<void>();
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly RideCategory: typeof RideCategory = RideCategory;
    public horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public rideId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('rideId')),
        shareReplay(1)
    );
    public ride: RideHistorySimple = this._router.getCurrentNavigation().extras.state?.ride;

    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
    ) {}

    public ngOnInit(): void {
    }
    //I'm not sure why Noah Shuat added this code here
    public rideTime(ride: Ride): string {
        const duration = calculateRideTime(ride);
        const formatter = new Intl.NumberFormat('en-US', {
            useGrouping: false,
            maximumFractionDigits: 0,
            minimumIntegerDigits: 2
        });

        const seconds = formatter.format((duration / 1000) % 60);
        const minutes = formatter.format((duration / 60000) % 60);
        const hours = formatter.format(duration / 3600000);

        return `${hours}:${minutes}:${seconds}`;
    }

    public rideDistance(ride: Ride): string {
        const distance = getRideKilometers(ride);
        const asMiles = kilometersToMiles(distance);

        const localized = asMiles.toLocaleString('en-US', {
            useGrouping: true,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });

        return localized;
    }
    //
}
