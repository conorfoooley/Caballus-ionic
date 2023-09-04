import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    kilometersToMiles,
    RideCategory,
    RideHistorySimple,
    RideEntryType
} from '@caballus/ui-common';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';


@Component({
    selector: 'app-view-user-ride-detail',
    templateUrl: './view-user-ride-detail.component.html',
    styleUrls: ['./view-user-ride-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUserRideDetailComponent implements OnInit {
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

    public entryType: string = this._router.getCurrentNavigation().extras.state?.entryType;
    public rideEntryType = RideEntryType.Manual;

    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
    ) {}

    public ngOnInit(): void {
    }
}
