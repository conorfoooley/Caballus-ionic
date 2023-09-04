import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    HorseDetails,
    HorseService,
    HorseSummaryForInvitation,
    InvitationType,
    ModalService,
    UserHorseRelationshipAction,
    UserProfile,
    UserService,
    UserToHorseSummary
} from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, combineLatest, iif, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';

@Component({
    selector: 'app-my-horses-page',
    templateUrl: './my-horses-page.component.html',
    styleUrls: ['./my-horses-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyHorsesPageComponent implements OnInit {
    public horsesProfilesData$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public options$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public hasNoData = false;
    public relationships$: BehaviorSubject<UserToHorseSummary[]> = new BehaviorSubject([]);
    public horses: UserToHorseSummary[];
    public userId!: string;

    private _onDestroy$: Subject<void> = new Subject();
    private _doRefresh$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(queryParams => queryParams.get('doRefresh')),
        shareReplay(1)
    );
    public user$: BehaviorSubject<UserProfile> = new BehaviorSubject(null);

    constructor(
        private readonly _router: Router,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseService: HorseService,
        private readonly _modalService: ModalService,
        private readonly _location: Location,
        private readonly _userService: UserService
    ) {}

    ngOnInit(): void {
        this._refreshHorseList();

        // get user id from the route
        this._activatedRoute.paramMap
            .pipe(
                take(1),
                switchMap(params => {
                    this.userId = params.get('id');
                    if (!this.userId) {
                        // get current user
                        return this._getCurrentUser();
                    } else if (this.userId) {
                        // get user details by id
                        return this._getUserById(this.userId);
                    }
                }),
                catchError(() => {
                    this._toastService.error('Error getting user details!');
                    return of(null);
                })
            )
            .subscribe(res => {
                this.user$.next(res);

                this.getViewableHorses(res._id);
            });
    }

    private _refreshHorseList(): void {
        this._horseCache.getHorsesForList().subscribe(
            response => {
                if (!response.length) {
                    this.hasNoData = true;
                }
                this.horsesProfilesData$.next(response);
                this.options$.next(response);
            },
            err => {
                this._toastService.error(err);
            }
        );
    }

    public async getViewableHorses(userId: string): Promise<void> {
        this._userService.getViewableHorses(userId).subscribe(response => {
            this.horses = response;
            this.relationships$.next(response);
        });
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public moveToCreateHorse(): void {
        this._router.navigateByUrl('/tabs/horse-profile/create-horse');
    }

    public moveToDetailHorse(horse: any): void {
        const returnTo = this.userId ? `/tabs/menu/profile/${this.userId}` : null;
        this._router.navigate(
            [`/tabs/horse-profile/detail-horse/general-tab/${horse.horseIdentity._id}`],
            {
                state: {
                    returnTo
                }
            }
        );
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
                        default: {
                            const err = 'Invalid invitation type, cannot open invitation';
                            this._toastService.success(err);
                            return throwError(err);
                        }
                    }
                }),
                tap(([inviteType, action]) => {
                    let acceptMessage;
                    let rejectMessage;
                    switch (inviteType) {
                        case InvitationType.OwnershipTransfer:
                            acceptMessage =
                                'Horse Transfer Successful. Horse has been added to your Horse List.';
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
                        default: {
                            const err = 'Invalid invitation response';
                            this._toastService.success(err);
                            return throwError(err);
                        }
                    }
                })
            )
            .subscribe();
    }

    public goBack(): void {
        this._location.back();
    }

    /**
     * _getCurrentUser
     * It will return current logged-in user
     * @private
     */
    private _getCurrentUser(): Observable<UserProfile> {
        return this._userService.getLoggedInUser().pipe(
            takeUntil(this._onDestroy$),
            map(res => {
                this.user$.next(res.profile);
                return res.profile;
            }),
            catchError(err => {
                this._toastService.error(err);
                return of(err);
            })
        );
    }

    /**
     * _getUserById
     * get user details by user id
     * @param userId
     * @private
     */
    private _getUserById(userId: string): Observable<UserProfile> {
        return this._userService.getProfile(userId).pipe(
            takeUntil(this._onDestroy$),
            map(user => {
                this.user$.next(user);
                return user;
            })
        );
    }
}
