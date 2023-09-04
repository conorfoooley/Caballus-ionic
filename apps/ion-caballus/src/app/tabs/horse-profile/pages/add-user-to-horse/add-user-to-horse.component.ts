import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorseRole, InvitationStatus, Role, RoleService, User, UserService } from '@caballus/ui-common';
import { InvitationCache } from '@ion-caballus/core/caches';
import { ToastService } from '@rfx/ngx-toast';
import _ from 'lodash';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import {
    catchError,
    filter,
    finalize,
    map,
    shareReplay,
    switchMap,
    take,
    tap
} from 'rxjs/operators';

@Component({
    selector: 'app-add-user-to-horse',
    templateUrl: './add-user-to-horse.component.html',
    styleUrls: ['./add-user-to-horse.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddUserToHorseComponent implements OnInit {
    public readonly InvitationStatus: typeof InvitationStatus = InvitationStatus;
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    private _roleId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('roleId')),
        shareReplay(1)
    );
    public user$: BehaviorSubject<User> = new BehaviorSubject(null);
    public horseRole$: BehaviorSubject<HorseRole> = new BehaviorSubject(null);
    public isSearching$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isSending$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public email: string = '';
    public horseId: string = '';
    public roleId: string = '';

    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _toastService: ToastService,
        private readonly userService: UserService,
        private readonly _invitationCache: InvitationCache,
        private readonly _roleService: RoleService
    ) { }

    public ngOnInit(): void {
        this._roleId$
            .pipe(
                take(1),
                tap(roleId => this._findRole(roleId)),
                switchMap(id => (this.roleId = id))
            )
            .subscribe();
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => (this.horseId = id))
            )
            .subscribe();
    }

    private _findRole(roleId: string): void {
        this._roleService.getHorseRoles().subscribe(
            response => {
                const fRole = response.find(role => role._id === roleId);
                this.horseRole$.next(fRole);
            },
            err => {
                this.horseRole$.next(null);
            }
        );
    }

    public backToPublicPermissions(isSent: boolean = false): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => {
                    if (!isSent) {
                        this._toastService.error('No Invite sent');
                    }
                    return this._router.navigateByUrl(
                        `/tabs/horse-profile/detail-horse/invites-permissions/${id}`
                    );
                })
            )
            .subscribe();
    }

    public searchUsersByEmail(): void {
        if (!this.email) {
            return;
        }
        this.isSearching$.next(true);
        this.userService
            .getUserByEmail(this.email)
            .pipe(
                take(1),
                tap(user => {
                    if (!!user) {
                        this.user$.next(user);
                    } else {
                        this._toastService.error('No user found');
                        this.user$.next(null);
                    }
                }),
                catchError(() => {
                    this.isSearching$.next(false);
                    this._toastService.error('Error retrieving user');
                    return of(null);
                }),
                finalize(() => this.isSearching$.next(false))
            )
            .subscribe();
    }

    public sendInvite(): void {
        this.isSending$.next(true);
        this.user$
            .pipe(
                take(1),
                switchMap(user =>
                    !user
                        ? throwError('No user email exist')
                        : this._invitationCache.createGeneralInvitation({
                            horseId: this.horseId,
                            toUserId: user.profile._id,
                            toRoleId: this.roleId
                        })
                ),
                tap(() => {
                    this.user$.next(null);
                    this._toastService.error('Invite Sent!');
                    this.backToPublicPermissions(true);
                    return true;
                }),
                catchError(err => {
                    this.isSending$.next(false);
                    this._toastService.error(err);
                    return of(null);
                }),
                finalize(() => this.isSending$.next(false))
            )
            .subscribe();
    }
}
