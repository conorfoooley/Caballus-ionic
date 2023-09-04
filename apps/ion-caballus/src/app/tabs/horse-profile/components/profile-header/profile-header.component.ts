import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Inject,
    Input,
    LOCALE_ID,
    Output,
    OnInit
} from '@angular/core';
import { formatNumber, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { kilometersToMiles, ModalService, Privacy, ToastService } from '@caballus/ui-common';
import { Share } from '@capacitor/share';
import { HorseCache } from '@ion-caballus/core/caches';
import { environment } from '@ion-caballus/env';
import { BehaviorSubject, combineLatest, from, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
const DigitsInfo = '1.2-2';

@Component({
    selector: 'app-profile-header',
    templateUrl: './profile-header.component.html',
    styleUrls: ['./profile-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileHeaderComponent implements OnInit {
    @Input()
    public doRefresh: boolean = false;
    @Input()
    public parentBack: boolean = false;
    @Input()
    public title: string = '';
    @Output()
    public goBack: EventEmitter<string> = new EventEmitter(null);
    public horseName$: BehaviorSubject<string> = new BehaviorSubject('');

    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _modalService: ModalService,
        private location: Location,
        @Inject(LOCALE_ID) private readonly _locale: string
    ) {}

    public ngOnInit(): void {
        this._horseId$
            .pipe(
                take(1),
                switchMap(id => this._horseCache.getHorseBasic(id).pipe(take(1)))
            )
            .subscribe(horse => {
                const name = horse.profile.registeredName
                    ? horse.profile.registeredName
                    : horse.profile.commonName
                    ? horse.profile.commonName
                    : 'View Horse';
                this.horseName$.next(name);
            });
    }

    public backToHorseList(): void {
        if (this.parentBack) {
            this.goBack.emit();
        } else {
            this.location.back();
        }
    }

    public onShare(): void {
        this._horseId$
            .pipe(
                take(1),
                switchMap(id =>
                    combineLatest([
                        from(this._horseCache.getHorse(id)),
                        from(this._horseCache.getHorseStatTotals(id))
                    ]).pipe(take(1))
                ),
                tap(([horse, horseStats]) => {
                    console.log(horse);
                    if (horse.profile.privacy.overallPrivacy !== Privacy.Public) {
                        this._modalService
                            .confirm(
                                `Horse Share Warning`,
                                `You cannot share a private horse profile.`,
                                `Okay`,
                                `Center`,
                                null
                            )
                            .afterClosed();
                        return;
                    }
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
                    const deeplink = `${environment.ionHorseProfileUrl}/horse-profile/${horse._id}`;
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
}
