import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    AuthService,
    BranchService,
    FriendService,
    InvitationService,
    ModalService as CommonModalService,
    UserEditDto,
    UserProfile,
    UserService,
    UserDisciplines
} from '@caballus/ui-common';
import { ModalService } from '@ion-caballus/core/services';
import { UserModalService } from '@ion-caballus/core/services/user-modal.service';
import { FriendStatus } from '@caballus/common';
import { FetchFriendsAction } from '@ion-caballus/state/actions';
import { ToastService } from '@rfx/ngx-toast';
import { Store } from '@ngxs/store';
import { catchError, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { InvitationCache } from '@ion-caballus/core/caches';
import { BehaviorSubject, from, Observable, of, Subject, throwError } from 'rxjs';
import { Browser } from '@capacitor/browser';
import { environment } from '@ion-caballus/env';

@Component({
    selector: 'app-account-page',
    templateUrl: './account-page.component.html',
    styleUrls: ['./account-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountPageComponent implements OnInit, OnDestroy {
    public user$: BehaviorSubject<UserProfile> = new BehaviorSubject(null);
    public userId: string;
    public placeholder: string;
    private _onDestroy$: Subject<void> = new Subject<void>();

    public profilePictureUrl$: BehaviorSubject<string> = new BehaviorSubject(null);
    public userBioForm: FormGroup = this._formBuilder.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        url: ['', Validators.required],
        email: ['', Validators.required],
        phone: ['', Validators.required],
        disciplines: this._formBuilder.group({})
    });
    public isEditableMode$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public showEditIcon$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public title$: BehaviorSubject<string> = new BehaviorSubject('');
    public disciplineLabels: string[] = [];
    public userSelectedDisciplines$: BehaviorSubject<string> = new BehaviorSubject('');

    constructor(
        private readonly _userService: UserService,
        private readonly _toastService: ToastService,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _router: Router,
        private readonly _friendService: FriendService,
        private readonly _modalService: ModalService,
        private readonly _userModalService: UserModalService,
        private readonly _formBuilder: FormBuilder,
        private readonly _commonModalService: CommonModalService,
        private readonly _store: Store,
        private readonly _invitationCache: InvitationCache,
        private readonly _location: Location,
        private readonly _authService: AuthService,
        private readonly _branchService: BranchService,
        private readonly _invitationService: InvitationService
    ) {}

    ngOnInit(): void {
        // get user id from the route
        this._activatedRoute.paramMap
            .pipe(
                take(1),
                switchMap(params => {
                    this.userId = params.get('id');
                    // only logged in user can edit his/her profile
                    this.showEditIcon$.next(!this.userId);

                    if (!this.userId) {
                        // get current user
                        return this._getCurrentUser();
                    } else if (this.userId) {
                        // get user details by id
                        return this._getUserById(this.userId);
                    }
                }),
                // get params from the url
                switchMap(() => this._activatedRoute.queryParamMap),
                switchMap(params => {
                    if (params.get('pendingFriendRequestId')) {
                        // show pending friend request modal
                        return this._showFriendRequestPendingActionModal(
                            params.get('pendingFriendRequestId')
                        );
                    } else if (params.get('friendRequestId')) {
                        // fetch friend request details if friendRequestId is present as the url param
                        return this._friendService
                            .getFriendById(params.get('friendRequestId'))
                            .pipe(
                                switchMap(friendRequest =>
                                    this._modalService
                                        .friendRequestModal(friendRequest)
                                        .pipe(map(result => result))
                                ),
                                switchMap(({ status }) => {
                                    if (status === FriendStatus.Rejected) {
                                        // if friend request is rejected then show block user confirmation
                                        return this._blockUserConfirmation();
                                    }
                                    // otherwise don't do anything
                                    return of(null);
                                }),
                                catchError(err => {
                                    console.log(err);
                                    this._toastService.error(err);
                                    return of(err);
                                })
                            );
                    } else if (params.get('subscriptionInvitationId')) {
                        // verify if we need to show the showPaymentRequestModal
                        return this._showPaymentRequestModal(
                            params.get('subscriptionInvitationId')
                        );
                    }
                    return of(null);
                })
            )
            .subscribe();
    }

    public previewUserProfileImage(): void {
        this.user$
            .pipe(
                take(1),
                switchMap(user => this.openUserProfileImage(user._id))
            )
            .subscribe();
    }

    private openUserProfileImage(userId: string): Observable<UserProfile> {
        return this._userModalService.userProfileImage(userId).pipe(
            take(1),
            tap(user => {
                if (user) {
                    this.user$.next(user);
                }
            })
        );
    }

    public onEdit(): void {
        const isEditableMode = this.isEditableMode$.getValue();
        if (isEditableMode) {
            this.isEditableMode$.next(false);
            return;
        }
        const user = this.user$.getValue();
        this.userBioForm.patchValue({
            ...user
        });
        this.isEditableMode$.next(true);
    }

    public onBioEdit(): void {
        this.isLoading$.next(true);
        // we need to convert the labels to their corresponding enum values
        const disciplineValues: UserDisciplines[] = [];
        Object.keys(this.userBioForm.value.disciplines).forEach(key => {
            // the lables have spaces in them, so we need to remove them to access the enum
            const noSpaceKey = key.replace(/\s/g, '');
            if (this.userBioForm.value.disciplines[key]) {
                disciplineValues.push(UserDisciplines[noSpaceKey]);
            }
        });
        // for some reason I couldn't patch the form value with an array, it kept resolving to an object
        // so just make a copy and set the disciplines property to the array
        const formCopy = { ...this.userBioForm.value };
        formCopy.disciplines = disciplineValues;

        const dto = new UserEditDto(formCopy);
        this._userService.editLoginedUser(dto).subscribe();
        this.isLoading$.next(false);
        this.goBack();
    }

    public navigateToHorsePage(): void {
        if (this.userId) {
            this._router.navigateByUrl(`/tabs/menu/my-horses/${this.userId}`);
        } else {
            this._router.navigateByUrl('/tabs/menu/my-horses');
        }
    }

    public navigateToRideHistoryPage(): void {
        if (this.userId) {
            this._router.navigateByUrl(`tabs/menu/my-ride-history/${this.userId}`);
        } else {
            this._router.navigateByUrl('tabs/menu/my-ride-history');
        }
    }

    public goBack(): void {
        window.history.back();
        this.isEditableMode$.next(false);
    }

    /**
     * _showFriendRequestPendingActionModal
     * It will present the friend request pending action modal
     * @private
     */
    public _showFriendRequestPendingActionModal(friendRequestId: string): Observable<unknown> {
        return this._commonModalService
            .openActionDialog(
                'Waiting for Response',
                'This user has not responded to their friend invite yet.',
                'Cancel Invite',
                'Keep Waiting',
                'Resend Invite'
            )
            .afterClosed()
            .pipe(
                switchMap(res => {
                    switch (res) {
                        // Cancel Invite
                        case 'Button1':
                            return this._cancelFriendRequest(friendRequestId);
                        // Resend Invite
                        case 'Button3':
                            return this._resendFriendRequest(friendRequestId);
                        // Keep Waiting
                        case 'Button2':
                        default:
                            return of(undefined);
                    }
                })
            );
    }

    /**
     * _getCurrentUser
     * It will return current logged-in user
     * @private
     */
    private _getCurrentUser(): Observable<void | UserProfile> {
        return this._userService.getLoggedInUser().pipe(
            takeUntil(this._onDestroy$),
            map(res => {
                this.user$.next(res.profile);
                this.title$.next('My Profile');
                if (res.profile?.profilePicture?.url) {
                    this.profilePictureUrl$.next(res.profile.profilePicture.url);
                }
                // use the enum keys and toString() method to get the proper string label
                // need to remove the last element from the array because it is the 'default' value, then sort it by word length
                const keys = Object.keys(UserDisciplines);
                this.disciplineLabels = keys
                    .map(key => UserDisciplines.toString(UserDisciplines[key]))
                    .slice(0, this.disciplineLabels.length - 1)
                    .sort((a, b) => a.length - b.length);

                // need to check the user's disciplines and set the default value for the corresponding checkbox
                const userSelected = [];
                keys.forEach(key => {
                    const disciplines = this.userBioForm.controls.disciplines as FormGroup;
                    // the values stored on user profile are the enum values
                    const isDisciplineSelected = res.profile.disciplines
                        ? res.profile.disciplines.includes(UserDisciplines[key])
                        : false;
                    // this will control the default value of the checkbox
                    disciplines.addControl(
                        UserDisciplines.toString(UserDisciplines[key]),
                        new FormControl(isDisciplineSelected)
                    );
                    // this will control what disciplines to show in the user's profile
                    if (isDisciplineSelected) {
                        const discipline = UserDisciplines.toString(UserDisciplines[key]);
                        userSelected.push(discipline);
                    }
                });
                // convert the array of enum keys to a string and add spaces
                const selectedDisciplinesString = userSelected.join(', ');
                this.userSelectedDisciplines$.next(selectedDisciplinesString);
            }),
            catchError(err => {
                this._toastService.error(err);
                return of(null);
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
                this.title$.next(`${user.firstName} ${user.lastName}'s Profile`);
                if (user.profilePicture?.url) {
                    this.profilePictureUrl$.next(user.profilePicture.url);
                }
                return user;
            })
        );
    }

    /**
     * block user confirmation
     * show block user confirmation popup when user rejects a friend request
     * @private
     */
    private _blockUserConfirmation(): Observable<void> {
        return this._commonModalService
            .openActionDialog(
                'Invitation Declined',
                'Friend Invite Declined.  Requester has been notified. Would you like to block this person from sending future invites?',
                'No',
                'Yes'
            )
            .afterClosed()
            .pipe(switchMap(button => (button && button === 'Button2' ? of(null) : of(undefined))));
    }

    /**
     * _fetchFriends
     * fetch friends list
     * @private
     */
    private _fetchFriends(): void {
        this._store.dispatch(new FetchFriendsAction());
    }

    /**
     * _cancelFriendRequest
     * cancel friend request
     * @private
     */
    private _cancelFriendRequest(friendRequestId: string): Observable<unknown> {
        return this._friendService.removeFriend(friendRequestId).pipe(
            map(() => {
                this._toastService.success('Invite Canceled');
                this._location.go(
                    this._location.path().slice(0, this._location.path().lastIndexOf('/'))
                );
                this._fetchFriends();
            }),
            catchError(err => {
                this._toastService.error('Cancel Invite Failed');
                return throwError(err);
            })
        );
    }

    /**
     * _resendFriendRequest
     * resend friend request
     * @private
     */
    private _resendFriendRequest(friendRequestId: string): Observable<any> {
        let user: UserProfile;
        this.user$.pipe(take(1)).subscribe(usr => (user = usr));
        return this._invitationCache
            .friendRequest({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                friendRequestId
            })
            .pipe(
                map(() => {
                    this._toastService.success('Invite Resent');
                    this._fetchFriends();
                }),
                catchError(err => {
                    this._toastService.error('Resent Invite Failed');
                    return throwError(err);
                })
            );
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    /**
     * _showPaymentRequestModal
     * @param subscriptionInvitationId
     * @private
     */
    private _showPaymentRequestModal(subscriptionInvitationId: string): Observable<unknown> {
        // get subscription details invitation details
        return this._invitationService.subscriptionTransferDetails(subscriptionInvitationId).pipe(
            switchMap(() =>
                this._commonModalService
                    .message(
                        'Payment Responsibility',
                        "You've received a Request from this user click continue to review request!",
                        'continue'
                    )
                    .afterClosed()
            ),
            // fire subscription token generation api
            filter(confirmed => !!confirmed),
            switchMap(() => this._authService.generateAccountSubscriptionToken()),
            map(tokenResponse => (tokenResponse.token ? tokenResponse.token : null)),
            filter(token => !!token),
            switchMap(token =>
                // Generate deeplink of the pwa
                from(
                    this._branchService.generateDeepLink(
                        environment.ionBaseUrl,
                        `/tabs/map-my-ride`,
                        'subscriptionApp'
                    )
                ).pipe(
                    map(deepLink => ({
                        token,
                        deepLink
                    }))
                )
            ),
            // open PWA app
            switchMap(data =>
                from(
                    Browser.open({
                        url: `${environment.ionHorseProfileUrl}?token=${data.token}&deepLink=${data.deepLink}
                        &subscriptionInvitationId=${subscriptionInvitationId}`
                    })
                )
            ),
            catchError(err => {
                // show error message
                this._toastService.error(err && err.error ? err.error.message : err);
                return of(err);
            })
        );
    }
}
