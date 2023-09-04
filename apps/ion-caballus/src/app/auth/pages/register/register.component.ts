import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { RfxValidators, PasswordStrengthLevel } from '@rfx/ngx-forms';
import { ENABLE_VERIFIED_ACCOUNT_GATE, PlatformType, UserDeviceInfo, UserService, WEB_APP_VERSION } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { Store } from '@ngxs/store';
import { LoginAction } from '@ion-caballus/core/state/actions';
import { CapacitorPluginService, ModalService } from '@ion-caballus/core/services';
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
import { detect } from 'detect-browser';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import getBrowserFingerprint from 'get-browser-fingerprint';
import { Browser } from '@capacitor/browser';
import { generateUserNameFromEmail } from '@ion-caballus/core/util';

const AlphaNumericRegex = /^[a-z0-9]*$/;

enum PageStatus {
    BeforeSignup = '[PageStatus] beforeSignup',
    AfterSignup = '[PageStatus] afterSignup'
}

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {
    public readonly PageStatus: typeof PageStatus = PageStatus;

    @ViewChild('termsCheckbox')
    public termsCheckbox: MatCheckbox;

    public form: FormGroup = this._formBuilder.group({
        email: [null, [Validators.required, Validators.email]],
        password: [null, [Validators.required, RfxValidators.password(PasswordStrengthLevel.Moderate)]],
        acceptedTerms: [null, [Validators.required, RfxValidators.equal(true)]]
    });

    public passwordVisible$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);
    public submitting$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);
    public pageStatus$: BehaviorSubject<PageStatus> =
        new BehaviorSubject(PageStatus.BeforeSignup as PageStatus);

    private _onSubmit$: Subject<void> =
        new Subject();
    private _onViewWillLeave$: Subject<void> =
        new Subject();

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _userService: UserService,
        private readonly _toastService: ToastService,
        private readonly _store: Store,
        private readonly _router: Router,
        private readonly _modalService: ModalService,
        private readonly _changeDetectorRef: ChangeDetectorRef,
        private readonly _capacitorPluginService: CapacitorPluginService,
    ) { }

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
                this.form.addControl(
                    'confirmEmail',
                    new FormControl(
                        null,
                        [
                            Validators.required,
                            RfxValidators.equalTo(this.form.controls.email)
                        ]
                    )
                );
                this._changeDetectorRef.detectChanges();
            })
        ).subscribe();
        this.form.valueChanges.pipe(
            takeUntil(this._onViewWillLeave$),
            tap(() => {
                if (!!this.form.get('confirm')) {
                    this.form.controls.confirm.updateValueAndValidity({ emitEvent: false });
                }
                if (!!this.form.get('confirmEmail')) {
                    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
                }
            })
        ).subscribe();
    }

    public ionViewWillLeave(): void {
        this._onViewWillLeave$.next();
        this._onViewWillLeave$.complete();
    }


    public register(): Promise<void> {
        this._onSubmit$.next();
        if (this.form.invalid) {
            this._toastService.error('Check form for errors');
            return;
        }
        this.submitting$.next(true);
        this._userService.registerUser({
            ...this.form.value,
            firstName: '',
            lastName: '',
            url: generateUserNameFromEmail(this.form.value.email)
        }).pipe(
            switchMap(() => this._deviceInfo$),
            switchMap((deviceInfo) =>
                this._store.dispatch(new LoginAction(
                    this.form.value.email,
                    this.form.value.password,
                    deviceInfo
                ))
            ),
            tap(() => {
                this._toastService.success('Signed up');
                if (ENABLE_VERIFIED_ACCOUNT_GATE) {
                    this.pageStatus$.next(PageStatus.AfterSignup);
                } else {
                    this._router.navigateByUrl('/map-my-ride');
                }
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

    private _deviceInfo$: Observable<UserDeviceInfo> = new Observable(observer => {
        const platform = this._capacitorPluginService.isNativeAppPlatform().platform;
        if (platform === PlatformType.Web) {
            const webInfo = detect();
            const fingerprint = getBrowserFingerprint();
            const deviceInfoObj = new UserDeviceInfo({
                deviceId: String(fingerprint),
                os: webInfo.os,
                osVersion: webInfo.version,
                deviceName: webInfo.name,
                deviceModel: '',
                ramAvailable: 0,
                platform: this._capacitorPluginService.isNativeAppPlatform().platform,
                appInfo: [
                    {
                        appVersion: WEB_APP_VERSION,
                        loginAt: new Date()
                    }
                ]
            });
            observer.next(deviceInfoObj);
            observer.complete();
        } else {
            Promise.all([Device.getId(), Device.getInfo(), App.getInfo()]).then(([deviceId, info, appInfo]) => {
                const deviceInfo = new UserDeviceInfo({
                    deviceId: deviceId.uuid,
                    os: info.operatingSystem,
                    osVersion: info.osVersion,
                    deviceName: info.name,
                    deviceModel: info.model,
                    ramAvailable: info.realDiskFree,
                    platform: this._capacitorPluginService.isNativeAppPlatform().platform,
                    appInfo: [
                        {
                            appVersion: appInfo.version,
                            loginAt: new Date()
                        }
                    ]
                });
                observer.next(deviceInfo);
            });
        }
    });


    public toggleVisibility(): void {
        this.passwordVisible$.next(!this.passwordVisible$.value);
    }

    private _resetCheckbox(): void {
        this.form.controls.acceptedTerms.reset();
        this.form.controls.acceptedTerms.markAsUntouched();
    }

    public openPrivacyPolicy(): void {
        Browser.open({
            url: 'https://caballusapp.com/privacy-policy/'
        });
        this._resetCheckbox()
    }

    public continueToApp(): void {
        this._router.navigateByUrl('/map-my-ride');
    }
}

