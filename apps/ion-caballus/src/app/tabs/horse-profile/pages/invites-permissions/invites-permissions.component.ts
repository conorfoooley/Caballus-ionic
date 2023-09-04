import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    HorseRole,
    HorseService,
    InvitationDetailed,
    InvitationService,
    RoleService,
    InvitationStatus,
    ToastService
} from '@caballus/ui-common';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';

@Component({
    selector: 'app-invites-permissions',
    templateUrl: './invites-permissions.component.html',
    styleUrls: ['./invites-permissions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitesPermissionsComponent implements OnInit {
    public readonly InvitationStatus: typeof InvitationStatus = InvitationStatus;

    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );

    public horseRoles$: BehaviorSubject<HorseRole[]> = new BehaviorSubject([]);
    public invitations$: BehaviorSubject<InvitationDetailed[]> = new BehaviorSubject([]);
    public loading$: BehaviorSubject<boolean> = new BehaviorSubject(null);

    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _roleService: RoleService,
        private readonly _invitationService: InvitationService,
        private readonly _toastService: ToastService
    ) { }

    public ngOnInit(): void {
        this._roleService.getHorseRoles().subscribe(
            response => {
                const sorted = response.sort(this._roleReverseAlphabeticalSort);
                this.horseRoles$.next(sorted);
            },
            err => {
                this.horseRoles$.next([]);
            }
        );
        this.getInvitations();
    }

    private getInvitations(): void {
        this.loading$.next(true);
        this._horseId$.pipe(
            take(1),
            switchMap((id: string) => this._invitationService.getInvitationDetailedListByHorseId(id))
        ).subscribe(
            res => {
                this.invitations$.next(res);
                this.loading$.next(false);
            },
            err => {
                this._toastService.error(err);
                this.loading$.next(false);
            }
        );
    }

    private _roleReverseAlphabeticalSort(a: HorseRole, b: HorseRole): number {
        const textA = a.name.toUpperCase();
        const textB = b.name.toUpperCase();
        return (textA > textB) ? -1 : (textA > textB) ? 1 : 0;
    }

    public backToHorseList(): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id =>
                    this._router.navigateByUrl(`/tabs/horse-profile/detail-horse/general-tab/${id}`)
                )
            )
            .subscribe();
    }

    public moveToPublicPermissions(): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id =>
                    this._router.navigateByUrl(
                        `/tabs/horse-profile/detail-horse/public-permissions/${id}`
                    )
                )
            )
            .subscribe();
    }

    public moveToAddTrainerStudent(horseRoleId: string): void {
        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id =>
                    this._router.navigateByUrl(
                        `/tabs/horse-profile/detail-horse/add-user/${id}/${horseRoleId}`
                    )
                )
            )
            .subscribe();
    }

    public retractInvite(inviteId: string): void {
        this.loading$.next(true);
        this._invitationService.retractGeneralInvitation(inviteId).subscribe(
            () => {
                this.getInvitations();
            },
            err => {
                console.log(err);
                this._toastService.error(err);
                this.loading$.next(false);
            }
        );
    }
}
