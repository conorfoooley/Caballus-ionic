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
    User,
    wayPointPairStats
} from '@caballus/ui-common';
import { UserState } from '@caballus/ui-state';
import { Select } from '@ngxs/store';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { map, shareReplay, tap, take, switchMap, filter, delay } from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';
import { ModalService } from '@ion-caballus/core/services';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-view-ride-entry-detail',
    templateUrl: './view-ride-entry-detail.component.html',
    styleUrls: ['./view-ride-entry-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewRideEntryDetailComponent implements OnInit {

    public horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public ride$:RideHistorySimple = this._router.getCurrentNavigation().extras.state?.ride

    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
    ) {}

    public ngOnInit(): void {
    }
}
