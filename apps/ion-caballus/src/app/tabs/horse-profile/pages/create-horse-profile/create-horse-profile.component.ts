import { Component, OnInit, ChangeDetectionStrategy, Inject, LOCALE_ID } from '@angular/core';
import {
    Horse,
    HorseProfile,
    Gait,
    handsToMeter,
    HorseDetails, HorseService, kilometersToMiles, lbsToKg, milesToKilometers
} from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject } from 'rxjs';
import { HorseBreed } from '@caballus/ui-common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { createObjectID }  from 'mongo-object-reader';
import { formatNumber } from '@angular/common';
import { HorseCache } from '../../../../core/caches/horse/horse.cache';
const defaultSetting = Gait.defaultKilometersPerHour();
const DigitsInfo = '1.2-2';
const CREATE_NOTIFICATION_DURATION = 5000;
@Component({
    selector: 'app-create-horse-profile',
    templateUrl: './create-horse-profile.component.html',
    styleUrls: ['./create-horse-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateHorseProfileComponent implements OnInit {

    public horsesProfilesData$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public hasNoData: boolean = false;
    public readonly HorseBreed: typeof HorseBreed = HorseBreed;
    public shareHorse: boolean = false;
    public profileForm: FormGroup = this._formBuilder.group({
        commonName: [null, Validators.required],
        registeredName: [null],
        breed: [null],
        registrationNumber: [null],
        heightMeters: [null],
        weightKilograms: [null]
    });

    public gaitsKilometersPerHourFrom: FormGroup = this._formBuilder.group({
        None: [formatNumber(kilometersToMiles(defaultSetting['[Gait]_none']), this._locale, DigitsInfo)],
        Walk: [formatNumber(kilometersToMiles(defaultSetting['[Gait]_walk']), this._locale, DigitsInfo), Validators.required],
        Trot: [formatNumber(kilometersToMiles(defaultSetting['[Gait]_trot']), this._locale, DigitsInfo), Validators.required],
        Lope: [formatNumber(kilometersToMiles(defaultSetting['[Gait]_lope']), this._locale, DigitsInfo), Validators.required],
        Gallop: [formatNumber(kilometersToMiles(defaultSetting['[Gait]_gallop']), this._locale, DigitsInfo), Validators.required]
    });

    public submissionAttempted: boolean;
    public submitting$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _router: Router,
        private readonly _formBuilder: FormBuilder,
        private readonly _toastService: ToastService,
        private readonly _horseCache: HorseCache,
        @Inject(LOCALE_ID) private readonly _locale: string,
    ) { }

    public ngOnInit(): void {
        if (!!history.state.horseName) {
            this.profileForm.get('commonName').setValue(history.state.horseName);
        }
    }

    public changeShareCheckBox(val): void {
        this.shareHorse = val;
    }

    public createHorseProfile(): void {
        this.submissionAttempted = true;
        if (!this.profileForm.valid || !this.gaitsKilometersPerHourFrom.valid) {
            return;
        }
        this.submitting$.next(true);
        const gaitsKilometersPerHour = {
            '[Gait]_none': milesToKilometers(this.gaitsKilometersPerHourFrom.value.None),
            '[Gait]_walk': milesToKilometers(this.gaitsKilometersPerHourFrom.value.Walk),
            '[Gait]_trot': milesToKilometers(this.gaitsKilometersPerHourFrom.value.Trot),
            '[Gait]_lope': milesToKilometers(this.gaitsKilometersPerHourFrom.value.Lope),
            '[Gait]_gallop': milesToKilometers(this.gaitsKilometersPerHourFrom.value.Gallop),
        };
        const dto = new Horse({
            _id: createObjectID(),
            gaitsKilometersPerHour,
            profile: new HorseProfile({
                ...this.profileForm.value,
                heightMeters: handsToMeter(this.profileForm.value.heightMeters),
                weightKilograms: lbsToKg(this.profileForm.value.weightKilograms)
            })
        });
        this._horseCache.addHorseForRide(dto)
            .pipe(
                finalize(() => {
                    this.submitting$.next(false);
                })
            ).subscribe(
                () => {
                    this._toastService.custom({
                        message:
                            `${`${this.profileForm.value.commonName} has been added, and  is available for riding.` +
                            ' You may also add additional details for this horse by'}
            (1) viewing the horse by selecting it here in your dashboard, and then
            (2) while viewing the horse, select the edit icon (pencil) in the upper-right corner of the screen.`,
                        class: 'custom-msg',
                        duration: CREATE_NOTIFICATION_DURATION,
                        action: 'Close'
                    });
                    this._router.navigate(['/tabs/horse-profile'], {
                        queryParams: {
                            doRefresh: true
                        }
                    });
                },
                err => {
                    const message =
                        err.error && err.error.message ? err.error.message : 'Something went Wrong';
                    this._toastService.error(message);
                }
            );
    }

    public imageClick(): void {
        this._toastService.info(`You may upload an image here by editing this profile after you click "Save" on this screen`);
    }

    public resetGaitForm(): void {
        this.gaitsKilometersPerHourFrom.reset();
        this.gaitsKilometersPerHourFrom.patchValue({
            None: formatNumber(kilometersToMiles(defaultSetting['[Gait]_none']), this._locale, DigitsInfo),
            Walk: formatNumber(kilometersToMiles(defaultSetting['[Gait]_walk']), this._locale, DigitsInfo),
            Trot: formatNumber(kilometersToMiles(defaultSetting['[Gait]_trot']), this._locale, DigitsInfo),
            Lope: formatNumber(kilometersToMiles(defaultSetting['[Gait]_lope']), this._locale, DigitsInfo),
            Gallop: formatNumber(kilometersToMiles(defaultSetting['[Gait]_gallop']), this._locale, DigitsInfo),
        });
    }

    public goBack(): void {
        this._router.navigateByUrl('/tabs/horse-profile');
    }
}
