import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
    FormBuilder,
    FormGroup,
    FormControl,
    AbstractControl,
    Validators,
    ValidatorFn,
    ValidationErrors
} from '@angular/forms';
import { RfxValidators, PasswordStrengthLevel } from '@rfx/ngx-forms';
import { AuthService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { Subject, BehaviorSubject, of, Observable } from 'rxjs';
import {
    takeUntil,
    tap,
    finalize,
    catchError,
    map,
    shareReplay,
    take,
    switchMap
} from 'rxjs/operators';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {

    public form: FormGroup = this._formBuilder.group({
        password: [
            null,
            [
                Validators.required,
                RfxValidators.password(PasswordStrengthLevel.Moderate)
            ]
        ]
    });
    public passwordVisible$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);
    private _token$: Observable<string> = this._activatedRoute.queryParamMap.pipe(
        map(params => params.get('token')),
        shareReplay(1)
    );

    public submitting$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);

    private _onSubmit$: Subject<void> =
        new Subject();
    private _onViewWillLeave$: Subject<void> =
        new Subject();

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _authService: AuthService,
        private readonly _router: Router,
        private readonly _toastService: ToastService,
        private readonly _changeDetectorRef: ChangeDetectorRef
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
        this.passwordVisible$.pipe(
            takeUntil(this._onViewWillLeave$),
            tap(visible => {
                if (!visible) {
                    this.form.addControl(
                        'confirm',
                        new FormControl(
                            null,
                            [
                                Validators.required,
                                RfxValidators.equalTo(this.form.controls.password)
                            ]
                        )
                    );
                } else {
                    this.form.removeControl('confirm');
                }
                this._changeDetectorRef.detectChanges();
            })
        ).subscribe();
        this.form.valueChanges.pipe(
            takeUntil(this._onViewWillLeave$),
            tap(() => {
                if (!!this.form.get('confirm')) {
                    this.form.controls.confirm.updateValueAndValidity({ emitEvent: false });
                }
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
        this._token$.pipe(
            take(1),
            switchMap(token =>
                this._authService
                    .resetPassword(
                        `Bearer ${token}`,
                        this.form.value.password
                    )
            ),
            finalize(() => this.submitting$.next(false)),
            tap(() => {
                this._toastService.success('Password Updated');
                this._router.navigateByUrl('/auth/login');
            }),
            catchError(err => {
                console.error(err);
                this._toastService.error(err);
                return of(null);
            }),
        ).subscribe();
    }

    public toggleVisibility(): void {
        this.passwordVisible$.next(!this.passwordVisible$.value);
    }
}
