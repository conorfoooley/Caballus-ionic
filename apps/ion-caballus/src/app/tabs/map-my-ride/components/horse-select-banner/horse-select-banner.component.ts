import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    SimpleChanges
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalService } from '@ion-caballus/core/services';
import {
    BranchService,
    HorseForRide,
    HorseProfileStatus,
    ModalService as CommonModalService,
    Ride
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of, Subject } from 'rxjs';
import {
    debounceTime,
    filter,
    map,
    startWith,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { RideState } from '@ion-caballus/core/state';
import { UserState } from '@caballus/ui-state';

@Component({
    selector: 'app-horse-select-banner',
    templateUrl: './horse-select-banner.component.html',
    styleUrls: ['./horse-select-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseSelectBannerComponent implements OnInit {
    private readonly _showSearchThreshold: number = 10;

    public showSearchBar: boolean = false;

    @Select(RideState)
    public ride$!: Observable<Ride | null>;
    @Select(UserState.doesUserHaveActiveSubscription)
    public doesUserHaveActiveSubscription$: Observable<boolean>;

    @Input()
    public control!: FormControl;
    @Input()
    public clearSearch$!: Observable<void>;
    @Input()
    public horsesForRide!: HorseForRide[];

    @Input()
    public startingRide$!: Observable<Boolean>;

    public baseOptions$: BehaviorSubject<HorseForRide[]> = new BehaviorSubject([]);
    public options$: BehaviorSubject<HorseForRide[]> = new BehaviorSubject([]);
    public lockBanner$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    public showSearch$: Observable<boolean> = combineLatest([
        this.baseOptions$,
        this.lockBanner$
    ]).pipe(map(([opts, lock]) => opts.length >= this._showSearchThreshold && !lock));

    public searchControl: FormControl = new FormControl(null);

    private _onDestroy$: Subject<void> = new Subject();

    constructor(
        private readonly _modalService: ModalService,
        private readonly _changeDetectorRef: ChangeDetectorRef,
        private readonly _toastService: ToastService,
        private readonly _commonModalService: CommonModalService,
        private readonly _branchService: BranchService
    ) {}

    public ngOnInit(): void {
        /*
            Monitor lock behavior
        */
        combineLatest([this.startingRide$, this.ride$])
            .pipe(
                takeUntil(this._onDestroy$),
                tap(([startingRide, ride]) => {
                    if (!ride) {
                        this.control.setValue([]);
                    }
                    return this.lockBanner$.next(!!ride || !!startingRide);
                })
            )
            .subscribe();
        /*
            Filter results on search
        */
        combineLatest([this.baseOptions$, this.searchControl.valueChanges.pipe(startWith(null))])
            .pipe(
                // eslint-disable-next-line no-magic-numbers
                debounceTime(100),
                takeUntil(this._onDestroy$),
                tap(([baseOptions, val]) => this._filterOnSearch(baseOptions, val))
            )
            .subscribe();
        /*
            If show search toggles then clear value
        */
        this.showSearch$
            .pipe(
                takeUntil(this._onDestroy$),
                tap(() => this.searchControl.setValue(null))
            )
            .subscribe();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if ('horsesForRide' in changes) {
            if (!this.horsesForRide) {
                return;
            }

            const activeHorses = this.horsesForRide.filter(
                horse => horse.profileStatus === HorseProfileStatus.Active
            );
            this.baseOptions$.next(activeHorses);
        }
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public clearSearch(): void {
        this.searchControl.setValue(null);
        this._changeDetectorRef.detectChanges();
    }

    public toggle(i: number): void {
        this.showSearchBar = false;
        combineLatest([this.lockBanner$, this.options$])
            .pipe(
                take(1),
                tap(([lock, opts]) => {
                    if (lock) {
                        this._toastService.error('A ride is in progress');
                    }
                }),
                filter(([lock, opts]) => !lock),
                map(([lock, opts]) => opts),
                map(opts => {
                    const value = [...this.control.value];
                    const selected = value.includes(opts[i]._id);
                    return { horse: opts[i], selected };
                }),
                switchMap((v: { horse: HorseForRide; selected: boolean }) =>
                    this.options$.getValue().length > 1 ?
                    this._modalService
                        .toggleHorseToRide(v.horse, !v.selected)
                        .pipe(map(confirmed => ({ confirmed, ...v })))
                    : of({
                        confirmed: true, horse: v.horse, selected: v.selected
                    })
                ),
                tap((v: { confirmed: boolean; horse: HorseForRide; selected: boolean }) => {
                    if (v.confirmed) {
                        const value = [...this.control.value];
                        const idx = value.findIndex(elem => elem === v.horse._id);
                        v.selected ? value.splice(idx, 1) : value.push(v.horse._id);
                        this.control.setValue(value);
                        this._changeDetectorRef.detectChanges();
                    }
                })
            )
            .subscribe();
    }

    public quickAdd(): void {
        // verify if user have active subscription and active horse list is grater than 1
        forkJoin([this.doesUserHaveActiveSubscription$.pipe(take(1)), this.options$.pipe(take(1))])
            .pipe(
                switchMap(([doesUserHaveActiveSubscription, horsesForRide]) => {
                    if (!doesUserHaveActiveSubscription && horsesForRide.length >= 1) {
                        // show change account privileges modal
                        return this._commonModalService
                            .openActionDialog(
                                'Go Unlimited',
                                `For unlimited horses that you can share publicly you will need to be on an unlimited account.
                            Please visit My Account to make that change.`,
                                'My Account'
                            )
                            .afterClosed()
                            .pipe(
                                // don't do anything on click of  okay button
                                filter(button => button && button === 'Button1'),
                                // generate deep link and open the pwa app on click of my account page
                                switchMap(() => this._branchService.goToMyAccountPWAPage())
                            );
                    }

                    // show quick add horse modal
                    return this.lockBanner$.pipe(
                        take(1),
                        tap(lock => {
                            if (lock) {
                                this._toastService.error('A ride is in progress');
                            }
                        }),
                        filter(lock => !lock),
                        switchMap(() => this._modalService.quickAddHorse()),
                        tap((val: { horses: HorseForRide[]; newId: string }) => {
                            if (val) {
                                this.baseOptions$.next(val.horses);
                                const horse = val.horses.find(h => h._id === val.newId);
                                const value = [...this.control.value];
                                value.push(horse._id);
                                this.control.setValue(value);
                                this._changeDetectorRef.detectChanges();
                            }
                        })
                    );
                })
            )
            .subscribe();
    }

    public isSelected(i: number): Observable<boolean> {
        return this.options$.pipe(
            take(1),
            map(opts => {
                const value = [...this.control.value];
                if (!opts[i]) {
                    return false;
                }
                return value.includes(opts[i]._id);
            })
        );
    }

    public imgSource(i: number): Observable<string> {
        return this.options$.pipe(
            take(1),
            map(opts => opts[i]),
            map(horse =>
                !!horse.profilePicture && !!horse.profilePicture.url
                    ? horse.profilePicture.url
                    : './assets/images/horse-placeholder.png'
            )
        );
    }

    public onScroll(_event: Event): void {
        this.showSearchBar = true;
    }

    private _filterOnSearch(baseOptions: HorseForRide[], val: string): void {
        if (val) {
            this.options$.next(
                baseOptions.filter(o => o.commonName.toLowerCase().indexOf(val.toLowerCase()) > -1)
            );
        } else {
            this.options$.next(baseOptions);
        }
    }
}
