import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    HorseEvaluationSimple,
    User,
    HorsePermission,
    HorseEvaluationType
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, combineLatest, from, iif, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { State } from '@rfx/ngx-forms';
import { HorseCache } from '@ion-caballus/core/caches';
import { UserState } from '@caballus/ui-state';
import { Select } from '@ngxs/store';

@Component({
    selector: 'app-evaluation',
    templateUrl: './evaluation.component.html',
    styleUrls: ['./evaluation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluationComponent implements OnInit {
    @Select(UserState.user)
    public user$!: Observable<User>;
    private _onDestroy$: Subject<void> = new Subject<void>();
    public canEdit$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );

    public states: { key: string; name: string }[] =
        State.members.map(t => ({ key: t, name: State.toString(t) }));
    public horseEvaluations$: BehaviorSubject<HorseEvaluationSimple[]> = new BehaviorSubject([]);
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
    private _doRefresh$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(queryParams => queryParams.get('doRefresh')),
        shareReplay(1)
    );
    public HorseEvaluationType: typeof HorseEvaluationType = HorseEvaluationType;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseCache: HorseCache
    ) {

    }

    public ngOnInit(): void {
        this._getHorseEvaluations();
    }

    public ionViewDidEnter(): void {
        this._doRefresh$
            .pipe(
                map(doRefresh => {
                    if (!!doRefresh) {
                        this.horseEvaluations$.next([]);
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
                        return this._horseCache.getHorseEvaluationByHorseId(horseId);
                    }
                    return of(null);
                }),
                tap(horseEvaluations => {
                    if (horseEvaluations?.length) {
                        this.horseEvaluations$.next(horseEvaluations);
                        this.isLoading$.next(false);
                    }
                }),
                catchError(error => {
                    this.isLoading$.next(false);
                    this._toastService.error(error || 'Error getting horse evaluations');
                    return of(null);
                }),
                finalize(() => this.isLoading$.next(false)),
            )
            .subscribe();
    }

    private _getHorseEvaluations(): void {
        this.isLoading$.next(true);
        this._horseId$.pipe(
            take(1),
            switchMap(id =>
                iif(() => !!id,
                    combineLatest([
                        from(this._horseCache.getHorseRelationships(id)),
                        from(this._horseCache.getHorseEvaluationByHorseId(id))
                    ]).pipe(take(1)), of(null))),
            tap(([relationship, horseEvaluations]) => {
                this.canEdit$.next(!!relationship.loggedInUserRole.permissions.includes(HorsePermission.HorseEdit));
                this.horseEvaluations$.next(horseEvaluations);
                this.isLoading$.next(false);
            }),
            catchError(error => {
                this.isLoading$.next(false);
                this._toastService.error(error || 'Error getting horse evaluations');
                return of(null);
            })
        ).subscribe();
    }


    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public backToHorseList(): void {
        this._router.navigateByUrl('/tabs/horse-profile');
    }

    public addEditHorseEvaluationModal(evaluationType: HorseEvaluationType | string, horseEvaluation?: HorseEvaluationSimple): void {
        this._horseId$.pipe(
            take(1),
            tap(horseId => {
                if (horseEvaluation?._id) {
                    this._router.navigate([`/tabs/horse-profile/detail-horse/evaluations/${horseId}/${horseEvaluation._id}`], {
                        state: {
                            horseEvaluation,
                            evaluationType
                        }
                    });
                } else {
                    this._router.navigate([`/tabs/horse-profile/detail-horse/evaluations/${horseId}/create`], {
                        state: {
                            evaluationType
                        }
                    });
                }
            })
        ).subscribe();
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
