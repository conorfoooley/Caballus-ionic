import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { takeUntil, tap, finalize, catchError } from 'rxjs/operators';
import { ToastService } from '@rfx/ngx-toast';
import { AuthService } from '@caballus/ui-common';

enum PageStatus {
    BeforeSend = '[PageStatus] beforeSend',
    AfterSend = '[PageStatus] afterSend'
}

@Component({
    selector: 'app-resend-verification',
    templateUrl: './resend-verification.component.html',
    styleUrls: ['./resend-verification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResendVerificationComponent implements OnInit {
    public readonly PageStatus: typeof PageStatus = PageStatus;

    public form: FormGroup = this._formBuilder.group({
        email: [null, [Validators.email, Validators.required]]
    });

    public pageStatus$: BehaviorSubject<PageStatus> =
        new BehaviorSubject(PageStatus.BeforeSend as PageStatus);
    public submitting$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);

    private _onSubmit$: Subject<void> =
        new Subject();
    private _onViewWillLeave$: Subject<void> =
        new Subject();

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _router: Router,
        private readonly _authService: AuthService,
        private readonly _toastService: ToastService
    ) {}

    public ngOnInit(): void {

    }

    public ionViewWillEnter(): void {
        this._onSubmit$.pipe(
            takeUntil(this._onViewWillLeave$),
            tap(() => {
                this.form.markAllAsTouched();
                this.form.updateValueAndValidity();
            })
        ).subscribe();
    }

    public ionViewWillLeave(): void {
        this._onViewWillLeave$.next();
        this._onViewWillLeave$.complete();
    }

    public sendVerification(): void {
        this._onSubmit$.next();
        if (this.form.invalid) {
            this._toastService.error('Check form for errors');
            return;
        }
        this.submitting$.next(true);
        this._authService
            .resendVerification(this.form.value.email)
            .pipe(
                tap(() => {
                    this._toastService.success('Request received');
                    this.pageStatus$.next(PageStatus.AfterSend);
                }),
                finalize(() => this.submitting$.next(false)),
                catchError(err => {
                    console.error(err);
                    this._toastService.error(
                        err instanceof HttpErrorResponse
                            ? err.error.message
                            : 'Request Error'
                    );
                    return of(undefined);
                })
            ).subscribe();
    }

    public continueToLogin(): void {
        this._router.navigateByUrl('/auth/login');
    }
}
