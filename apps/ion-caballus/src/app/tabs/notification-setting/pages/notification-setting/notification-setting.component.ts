import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { Store } from '@ngxs/store';
import { FetchNavigationAction } from '@ion-caballus/core/state/actions';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastService, UserService } from '@caballus/ui-common';
import { catchError, finalize, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-notification-setting',
    templateUrl: './notification-setting.component.html',
    styleUrls: ['./notification-setting.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationSettingComponent implements OnInit, OnDestroy {
    private _onDestroy$: Subject<void> = new Subject<void>();
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public userNotificationSettingForm: FormGroup = this._formBuilder.group({
        allowNotificationSetting: this._formBuilder.group({
            onNewDataAddedOnHorse: [false],
            onHorseFollowNewActivity: [false],
            onFriendHasNewActivity: [false],
        }),
        sendNotificationSetting: this._formBuilder.group({
            appPushNotification: [false],
            emailNotification: [false],
        }),
    });

    public get allowNotificationSetting(): FormGroup {
      return this.userNotificationSettingForm.get('allowNotificationSetting') as FormGroup;
    }

    public get sendNotificationSetting(): FormGroup {
      return this.userNotificationSettingForm.get('sendNotificationSetting') as FormGroup;
    }

    constructor(
        private readonly _router: Router,
        private readonly _store: Store,
        private readonly _formBuilder: FormBuilder,
        private readonly _userService: UserService,
        private readonly _toastService: ToastService,
    ) { }

    public ngOnInit(): void {
        this._store.dispatch(FetchNavigationAction);
        this.isLoading$.next(true);
        this._userService.getUserNotificationSetting().pipe(
            take(1),
            tap((res) => this.userNotificationSettingForm.patchValue(res)),
            catchError(() => {
                this._toastService.error('Error getting user notification setting');
                return of(null);
            }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public goBack(): void {
        this._router.navigateByUrl('/tabs/notifications');
    }

    public onUpdateNotificationSetting(): void {
        this.isLoading$.next(true);
        this._userService.updateUserNotificationSetting(this.userNotificationSettingForm.value.allowNotificationSetting, this.userNotificationSettingForm.value.sendNotificationSetting).pipe(
            take(1),
            tap(() => this._toastService.success('Notification setting saved')),
            catchError(() => {
                this._toastService.error('Error updating user notification setting');
                return of(null);
            }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }
}
