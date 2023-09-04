import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { HorseBreed, HorseDetails, Invitation, kgToLbs, meterToHands, User, UserService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { InvitationCache } from '../../../../core/caches/invitation/invitation.cache';
import { BehaviorSubject, iif, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: 'app-transfer-horse-component',
    templateUrl: './transfer-horse.component.html',
    styleUrls: ['./transfer-horse.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferHorseComponent implements OnInit {
    public horse!: HorseDetails;
    public cancelTransferModal!: boolean;
    public invitations!: Invitation[];
    public user$: BehaviorSubject<User> = new BehaviorSubject(null);
    public HorseBreed: typeof HorseBreed = HorseBreed;
    public isSearching$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isCanceling$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isInitiate$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public searchControl: FormControl = new FormControl('', [
        Validators.email,
        Validators.required
    ]);
    public readonly kgToLbs: (k: number) => number = kgToLbs;
    public readonly meterToHands: (k: number) => number = meterToHands;
    
    public validations = {
        email: [
            { type: 'required', message: 'Email is required.' },
            { type: 'email', message: ' Please enter a valid email address.' }
        ]
    };
    constructor(
        private readonly _invitationCache: InvitationCache,
        private readonly _toastService: ToastService,
        private readonly _userService: UserService,
        private readonly _router: Router
    ) {}

    public ngOnInit(): void {
        this.horse = this._router.getCurrentNavigation().extras.state?.horse;
        this.cancelTransferModal = this._router.getCurrentNavigation().extras.state?.cancelTransferModal;
        this.invitations = this._router.getCurrentNavigation().extras.state?.invitations;
        this._findUserById();
    }

    public findUserByEmail(): void {
        if (this.searchControl.invalid) {
            return;
        }
        this.isSearching$.next(true);
        this._userService
            .getUserByEmail(this.searchControl.value)
            .pipe(
                take(1),
                tap(user => {
                    if (!!user) {
                        this.user$.next(user);
                    } else {
                        this._toastService.error('A user with that email is not found');
                    }
                }),
                catchError(() => {
                    this.isSearching$.next(false);
                    this._toastService.error('Error getting user find');
                    return of(null);
                }),
                finalize(() => this.isSearching$.next(false))
            )
            .subscribe();
    }

    public goBack(): void {
        this._router.navigate([`/tabs/horse-profile/detail-horse/general-tab/${this.horse._id}`]);
    }

    public resetUser(): void {
        this.searchControl.setValue('');
        this.searchControl.markAsPristine();
        this.searchControl.markAsUntouched();
        this.user$.next(null);
    }

    public initiateUser(): void {
        this.isInitiate$.next(true);
        this.user$
            .pipe(
                take(1),
                switchMap(user =>
                    !user
                        ? throwError('No user id exist')
                        : this._invitationCache.createOwnershipTransferInvitation({
                              horseId: this.horse._id,
                              recipientEmail: user.profile.email
                          })
                ),
                tap(() => {
                    this._toastService.success(
                        'Horse Transfer Initiated. Email Notification Sent to buyer.'
                    );
                    this._router.navigate(
                        [`/tabs/horse-profile/detail-horse/general-tab/${this.horse._id}`],
                        {
                            queryParams: {
                                refreshInvitations: true
                            }
                        }
                    );
                }),
                catchError(err => {
                    this.isInitiate$.next(false);
                    console.error(err);
                    this._toastService.error(err);
                    return of(null);
                })
            )
            .subscribe();
    }

    private _findUserById(): void {
        if (this.cancelTransferModal) {
            const email = this.invitations[0].to.email;
            this._userService
                .getUserByEmail(email)
                .pipe(
                    take(1),
                    tap(user => {
                        this.user$.next(user);
                    }),
                    catchError(err => {
                        this.isSearching$.next(false);
                        this._toastService.error('Error getting user find');
                        console.error(err);
                        return of(null);
                    }),
                    finalize(() => this.isSearching$.next(false))
                )
                .subscribe();
        }
    }

    public cancelTransferHorseProfile(): void {
        this.isCanceling$.next(true);
        this._invitationCache
            .retractOwnershipTransferInvitation(this.horse._id)
            .pipe(
                take(1),
                tap(() => {
                    this._toastService.success(
                        'Horse Transfer Cancelled.  Email notification sent.'
                    );
                    this._router.navigate(
                        [`/tabs/horse-profile/detail-horse/general-tab/${this.horse._id}`],
                        {
                            queryParams: {
                                refreshInvitations: true
                            }
                        }
                    );
                }),
                catchError(err => {
                    this.isCanceling$.next(false);
                    console.error(err);
                    this._toastService.error(err);
                    return of(null);
                })
            )
            .subscribe();
    }
}
