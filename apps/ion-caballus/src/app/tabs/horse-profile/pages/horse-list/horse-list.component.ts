import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    BranchService,
    HorseDetails,
    HorseProfileStatus,
    HorseService,
    HorseSummaryForInvitation,
    InvitationType,
    ModalService,
    UserHorseRelationshipAction
} from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { ToastService } from '@rfx/ngx-toast';
import {
    BehaviorSubject,
    combineLatest,
    forkJoin,
    iif,
    Observable,
    of,
    Subject,
    throwError
} from 'rxjs';
import {
    debounceTime,
    filter,
    map,
    shareReplay,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { UserState } from '@caballus/ui-state';

@Component({
    selector: 'app-horse-list',
    templateUrl: './horse-list.component.html',
    styleUrls: ['./horse-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseListComponent implements OnInit {
    @Select(UserState.doesUserHaveActiveSubscription)
    public doesUserHaveActiveSubscription$: Observable<boolean>;

    public showSearch$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public horsesProfilesData$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public options$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public activeHorsesList$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public hasNoData: boolean = false;

    public searchControl: FormControl = new FormControl(null);

    private _onDestroy$: Subject<void> = new Subject();
    private _doRefresh$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(queryParams => queryParams.get('doRefresh')),
        shareReplay(1)
    );

    private _inviteId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('inviteId')),
        shareReplay(1)
    );

    constructor(
        private readonly _router: Router,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseService: HorseService,
        private readonly _modalService: ModalService,
        private readonly _branchService: BranchService
    ) {
    }

    public ngOnInit(): void {
        this._refreshHorseList();
        this.searchControl.valueChanges
            .pipe(
                // eslint-disable-next-line no-magic-numbers
                debounceTime(100),
                takeUntil(this._onDestroy$),
                tap(val => this._filterOnSearch(val))
            )
            .subscribe();
        this._inviteId$.pipe(take(1)).subscribe(inviteId => {
            if (!!inviteId) {
                this._openInvitation(inviteId);
            }
        });
    }

    private _refreshHorseList(): void {
        this._horseCache.getHorsesForList().subscribe(
            response => {
                if (!response.length) {
                    this.hasNoData = true;
                }
                // sort by profile.profileStatus
                const sorted = response.sort((a, b) => {
                    if (a.profile.profileStatus === b.profile.profileStatus) {
                        return 0;
                    }
                    return a.profile.profileStatus > b.profile.profileStatus ? 1 : -1;
                });

                this.horsesProfilesData$.next(sorted);
                this.options$.next(response);
                this.activeHorsesList$.next(
                    response.filter(
                        horse => horse.profile.profileStatus === HorseProfileStatus.Active
                    )
                );
            },
            err => {
                this._toastService.error(err);
            }
        );
    }

    private _filterOnSearch(val): void {
        if (val) {
            this.options$.next(
                this.horsesProfilesData$.value.filter(
                    o => o.profile.commonName.toLowerCase().indexOf(val.toLowerCase()) > -1
                )
            );
        } else {
            this.options$.next(this.horsesProfilesData$.value);
        }
    }

    public toggleSearch(): void {
        this.showSearch$.next(!this.showSearch$.value);
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public moveToCreateHorse(): void {
        // verify if user have active subscription and active horse list is grater than 1
        forkJoin([
            this.doesUserHaveActiveSubscription$.pipe(take(1)),
            this.activeHorsesList$.pipe(take(1))
        ])
            .pipe(
                switchMap(([doesUserHaveActiveSubscription, activeHorsesList]) => {
                    if (!doesUserHaveActiveSubscription && activeHorsesList.length >= 1) {
                        // show change account privileges modal
                        return this._modalService
                            .openActionDialog(
                                'Change Account-Privileges',
                                `You have reached the maximum number of horses for a default account.
                            In order to add additional horses, please change your account privileges
                            (select the bottom-right menu-item, then click "My Account")`,
                                'My Account',
                                'Okay'
                            )
                            .afterClosed()
                            .pipe(
                                // don't do anything on click of  okay button
                                filter(button => button && button === 'Button1'),
                                // generate deep link and open the pwa app on click of my account page
                                switchMap(() => this._branchService.goToMyAccountPWAPage())
                            );
                    }

                    // redirect user to create-horse screen
                    return this._router.navigateByUrl('/tabs/horse-profile/create-horse');
                })
            )
            .subscribe();
    }

    public moveToDetailHorse(horse: HorseDetails): void {
        this._router.navigateByUrl(`/tabs/horse-profile/detail-horse/general-tab/${horse._id}`);
    }

    public ionViewDidEnter(): void {
        this._doRefresh$
            .pipe(
                switchMap(doRefresh =>
                    iif(() => !!doRefresh, this._horseCache.getHorsesForList(), of(null))
                ),
                tap(response => {
                    if (response instanceof Array) {
                        if (!response.length) {
                            this.hasNoData = true;
                        }
                        this.horsesProfilesData$.next(response);
                        this.options$.next(response);
                    }
                })
            )
            .subscribe();
    }

    private _openInvitation(inviteId: string): void {
        this._horseService
            .getHorseSummaryByInvitationId(inviteId)
            .pipe(
                switchMap((invitationSummary: HorseSummaryForInvitation) => {
                    switch (invitationSummary.invitationType) {
                        case InvitationType.OwnershipTransfer:
                            return combineLatest([
                                of(invitationSummary.invitationType),
                                this._modalService
                                    .ownershipTransferResponse(invitationSummary, inviteId)
                                    .afterClosed()
                            ]);
                        case InvitationType.General:
                            return combineLatest([
                                of(invitationSummary.invitationType),
                                this._modalService
                                    .generalInvitationResponse(invitationSummary, inviteId)
                                    .afterClosed()
                            ]);
                        default:
                            const err = 'Invalid invitation type, cannot open invitation';
                            this._toastService.success(err);
                            return throwError(err);
                    }
                }),
                tap(([inviteType, action]) => {
                    let acceptMessage;
                    let rejectMessage;
                    switch (inviteType) {
                        case InvitationType.OwnershipTransfer:
                            acceptMessage =
                                'Horse Transfer Successfull. Horse has been added to your Horse List.';
                            rejectMessage =
                                'Horse Transfer Ownership Cancelled. Owner has been notified.';
                            break;
                        case InvitationType.General:
                            acceptMessage =
                                'You have accepted the invitation. This horse has been added to your Horse List.';
                            rejectMessage =
                                'You have declined this invitation. The owner has been notified.';
                            break;
                        default:
                            break;
                    }

                    switch (action) {
                        case UserHorseRelationshipAction.Accept:
                            this._toastService.success(acceptMessage);
                            this._refreshHorseList();
                            break;
                        case UserHorseRelationshipAction.Reject:
                            this._toastService.success(rejectMessage);
                            break;
                        default:
                            const err = 'Invalid invitation response';
                            this._toastService.success(err);
                            return throwError(err);
                    }
                })
            )
            .subscribe();
    }
}
