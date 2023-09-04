import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    kilometersToMiles,
    Ride,
    RideCategory,
    RideHistorySimple,
} from '@caballus/ui-common';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
    selector: 'app-share-ride-detail',
    templateUrl: './share-ride-detail.component.html',
    styleUrls: ['./share-ride-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareRideDetailComponent implements OnInit {
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly RideCategory: typeof RideCategory = RideCategory;
    public horseId$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public rideId$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
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

    goBack() {
        this._router.navigateByUrl('/map-my-ride');
    }

}
