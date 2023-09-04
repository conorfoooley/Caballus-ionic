import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    Input
} from '@angular/core';
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
    selector: 'app-ride-entry-detail',
    templateUrl: './ride-entry-detail.component.html',
    styleUrls: ['./ride-entry-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideDetailEntryComponent implements OnInit {
    @Select(UserState.user)
    public user$!: Observable<User>;
    private _onDestroy$: Subject<void> = new Subject<void>();
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly RideCategory: typeof RideCategory = RideCategory;

    public ride$: BehaviorSubject<RideHistorySimple> = new BehaviorSubject(null);
    public horseNames$: BehaviorSubject<string[]> = new BehaviorSubject([]);
    public states: { key: string; name: string }[] = State.members.map(t => ({
        key: t,
        name: State.toString(t)
    }));

    public editFlag: boolean = false;
    public duration: string = '';
    public datePipe: DatePipe = new DatePipe('en-US');

    @Input('ride')
    public ride: any;
    @Input('backFlag')
    public backFlag: string = '';
    @Input('horseId')
    public horseId$: Observable<string>;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseService: HorseService,
        private readonly _modalService: ModalService
    ) {}

    public ngOnInit(): void {
        const ride = this.ride;
        const newDate1 = new Date(ride.endDateTime).getTime();
        const newDate2 = new Date(ride.startDateTime).getTime();
        const diff = (newDate1 - newDate2) / 1000;
        const hours = Math.floor(diff / 3600);
        const min = Math.floor((diff - hours * 3600) / 60);
        const sec = diff - hours * 3600 - min * 60;
        this.duration =
            (hours > 9 ? `${hours}:` : `0${hours}:`) +
            (min > 9 ? `${min}:` : `0${min}:`) +
            (sec > 9 ? `${sec}` : `0${sec}`);
        this.ride$.next(ride);
        this.horseNames$.next(ride.horseIdentities.map(({ label }) => label));
        this.user$.subscribe(user => {
            if (ride.riderIdentity._id === user._id) {
                this.editFlag = true;
            }
        });
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public goBack(): void {
        if (this.backFlag == 'horse') {
            this.horseId$
                .pipe(
                    tap(horseId => {
                        this._router.navigate([
                            `/tabs/horse-profile/detail-horse/ride-history/${horseId}`
                        ]);
                    })
                )
                .subscribe();
        } else {
            this._router.navigate([`/tabs/menu/my-ride-history`]);
        }
    }

    public editRideEvent(): void {
        if (this.backFlag == 'horse') {
            this.horseId$
                .pipe(
                    take(1),
                    tap(horseId => {
                        this.ride$.subscribe(ride => {
                            this._router.navigate(
                                [`/tabs/horse-profile/detail-horse/ride-history-add/${horseId}`],
                                {
                                    state: {
                                        ride
                                    }
                                }
                            );
                        });
                    })
                )
                .subscribe();
        } else {
            this._router.navigate([`/tabs/menu/my-ride-history`]);
        }
    }

    public imageViewerModal(attachmentUrl: string, mediaId: string): void {
        this.horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => this.openModal(attachmentUrl, mediaId, id))
            )
            .subscribe();
    }

    public async openModal(attachmentUrl: string, mediaId: string, horseId: string): Promise<void> {
        this._modalService
            .imageViewerModal(attachmentUrl, mediaId, horseId, false, true)
            .pipe(take(1))
            .subscribe();
    }
}
