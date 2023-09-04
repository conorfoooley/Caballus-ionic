import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorseCompetitionSimple, User, HorsePermission } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, combineLatest, from, iif, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';
import { ModalService } from '@ion-caballus/core/services';
import { HorseCache } from '@ion-caballus/core/caches';
import { UserState } from '@caballus/ui-state';
import { Select } from '@ngxs/store';

@Component({
    selector: 'app-competition',
    templateUrl: './competition.component.html',
    styleUrls: ['./competition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompetitionComponent implements OnInit {
    @Select(UserState.user)
    public user$!: Observable<User>;
    private _onDestroy$: Subject<void> = new Subject<void>();
    public canEdit$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );

    public states: { key: string; name: string }[] = State.members.map(t => ({
        key: t,
        name: State.toString(t)
    }));
    public horseCompetitions$: BehaviorSubject<HorseCompetitionSimple[]> = new BehaviorSubject([]);
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
    private _doRefresh$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(queryParams => queryParams.get('doRefresh')),
        shareReplay(1)
    );
    constructor(
        private readonly _toastService: ToastService,
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseCache: HorseCache,
        private readonly _modalService: ModalService
    ) {}

    public ngOnInit(): void {
        this._getHorseCompetitions();
    }

    public ionViewDidEnter(): void {
        this._doRefresh$
            .pipe(
                map(doRefresh => {
                    if (!!doRefresh) {
                        this.horseCompetitions$.next([]);
                        this.isLoading$.next(true);
                        return true;
                    }
                    return false;
                }),
                switchMap(doRefresh => {
                    if (doRefresh) {
                        return this._horseId$;
                    } else {
                        return of(null);
                    }
                }),
                switchMap(horseId => {
                    if (horseId) {
                        return this._horseCache.getHorseCompetitionByHorseId(horseId);
                    }
                    return of(null);
                }),
                tap(horseCompetitions => {
                    if (horseCompetitions?.length) {
                        this.horseCompetitions$.next(horseCompetitions);
                    }
                    this.isLoading$.next(false);
                }),
                catchError(error => {
                    this.isLoading$.next(false);
                    this._toastService.error(error || 'Error getting horse competitions');
                    return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
            )
            .subscribe();
    }

    private _getHorseCompetitions(): void {
        this.isLoading$.next(true);
        this._horseId$
            .pipe(
                take(1),
                switchMap(id =>
                    iif(
                        () => !!id,
                        combineLatest([
                            from(this._horseCache.getHorseRelationships(id)),
                            from(this._horseCache.getHorseCompetitionByHorseId(id))
                        ]).pipe(take(1)),
                        of(null)
                    )
                ),
                tap(([relationship, horseCompetitions]) => {
                    this.canEdit$.next(
                        !!relationship.loggedInUserRole.permissions.includes(
                            HorsePermission.HorseEdit
                        )
                    );
                    this.horseCompetitions$.next(horseCompetitions);
                    this.isLoading$.next(false);
                }),
                catchError(error => {
                    this.isLoading$.next(false);
                    this._toastService.error(error || 'Error getting horse competitions');
                    return of(null);
                })
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public backToHorseList(): void {
        this._router.navigateByUrl('/tabs/horse-profile');
    }

    public openImageModal(image): void {
        this._modalService.horseCompetitionImage(image);
    }

    public addEditHorseCompetitionModal(horseCompeition?: HorseCompetitionSimple): void {
        this._horseId$
            .pipe(
                take(1),
                tap(horseId => {
                    if (horseCompeition?._id) {
                        this._router.navigate(
                            [
                                `/tabs/horse-profile/detail-horse/competitions/${horseId}/${horseCompeition._id}`
                            ],
                            {
                                state: {
                                    horseCompeition
                                }
                            }
                        );
                    } else {
                        this._router.navigate([
                            `/tabs/horse-profile/detail-horse/competitions/${horseId}/create`
                        ]);
                    }
                })
            )
            .subscribe();
    }

    public goBack(): void {
        this._horseId$.pipe(
            take(1),
            tap((horseId) => {
                this._router.navigate([`/tabs/horse-profile/detail-horse/general-tab/${horseId}`]);
            })
        ).subscribe()
    }
}
