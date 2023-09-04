import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { Store } from '@ngxs/store';
import { LogoutAction } from '@ion-caballus/core/state/actions';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, shareReplay, take, switchMap, tap, catchError } from 'rxjs/operators';

enum PageStatus {
    BeforeVerify = '[PageStatus] beforeVerify',
    AfterVerify = '[PageStatus] afterVerify',
    Problem = '[PageStatus] problem'
}

@Component({
    selector: 'app-verify-account',
    templateUrl: './verify-account.component.html',
    styleUrls: ['./verify-account.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyAccountComponent implements OnInit {
    public PageStatus: typeof PageStatus = PageStatus;

    private _token$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(params => params.get('token')),
        shareReplay(1)
    );

    public pageStatus$: BehaviorSubject<PageStatus> =
        new BehaviorSubject(PageStatus.BeforeVerify as PageStatus);
    public submitting$: BehaviorSubject<boolean> =
        new BehaviorSubject(true);

    constructor(
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _authService: AuthService,
        private readonly _router: Router,
        private readonly _toastService: ToastService,
        private readonly _store: Store
    ) {}

    public ngOnInit(): void {

    }

    public ionViewWillEnter(): void {
        this._token$.pipe(
            take(1),
            switchMap(token =>
                this._authService.verifyAccount(`Bearer ${token}`)
            ),
            tap(() => {
                this.pageStatus$.next(PageStatus.AfterVerify);
                this._toastService.success('Account verified');
            }),
            catchError(err => {
                console.error(err);
                this._toastService.error(
                    err instanceof HttpErrorResponse
                        ? err.error.message
                        : 'Request Error'
                );
                this.pageStatus$.next(PageStatus.Problem);
                return of(undefined);
            })
        ).subscribe();
    }

    public continueToLogin(): void {
        this._router.navigateByUrl('/auth/login');
    }

    public goToResend(): void {
        this._router.navigateByUrl('/auth/resend-verification');
    }
}
