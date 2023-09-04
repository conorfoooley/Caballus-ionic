import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, tap, finalize, catchError } from 'rxjs/operators';

enum SentStatus {
    NotSent = '[SentStatus] notSent',
    Sent = '[SentStatus] sent'
}

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit {
    public readonly SentStatus: typeof SentStatus = SentStatus;

    public form: FormGroup = this._formBuilder.group({
        email: [null, [Validators.required, Validators.email]]
    });

    public sentStatus$: BehaviorSubject<SentStatus> =
        new BehaviorSubject(SentStatus.NotSent as SentStatus);
    public submitting$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);

    private _onSubmit$: Subject<void> =
        new Subject();
    private _onViewWillLeave$: Subject<void> =
        new Subject();

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _toastService: ToastService,
        private readonly _authService: AuthService
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

    public onSubmit(): void {
        this._onSubmit$.next();
        if (this.form.invalid) {
            this._toastService.error('Check form for errors');
            return;
        }
        this.submitting$.next(true);
        this._authService
            .forgotPassword(this.form.value.email)
            .pipe(
                finalize(() => this.submitting$.next(false)),
                tap(() => this.sentStatus$.next(SentStatus.Sent)),
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
}
