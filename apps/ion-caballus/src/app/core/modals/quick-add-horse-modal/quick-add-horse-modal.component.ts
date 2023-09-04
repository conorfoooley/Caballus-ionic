import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache } from '../../caches/horse/horse.cache';
import { createObjectID }  from 'mongo-object-reader';
import {
    Horse,
    HorseProfile,
    HorseProfileStatus,
    Gait,
    Privacy,
    HorseProfilePrivacy,
} from '@caballus/ui-common';
import { BehaviorSubject } from 'rxjs';
import { tap, finalize, take, filter } from 'rxjs/operators';

@Component({
    selector: 'app-quick-add-horse-modal',
    templateUrl: './quick-add-horse-modal.component.html',
    styleUrls: ['./quick-add-horse-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAddHorseModalComponent implements OnInit {

    public form: FormGroup = this._formBuilder.group({
        commonName: [null, Validators.required],
    });

    public quickCreating$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);

    constructor(
        private readonly _horseCache: HorseCache,
        private readonly _router: Router,
        private readonly _modalController: ModalController,
        private readonly _formBuilder: FormBuilder,
        private readonly _toastService: ToastService
    ) {}

    public ngOnInit(): void {

    }

    public quickCreate(): void {
        if (this.form.invalid) {
            this._toastService.error('Check form for errors');
            return;
        }
        this.quickCreating$.next(true);
        this._horseCache.addHorseForRide(
            new Horse({
                _id: createObjectID(),
                gaitsKilometersPerHour: Gait.defaultKilometersPerHour(),
                profile: new HorseProfile({
                    profileStatus: HorseProfileStatus.Active,
                    commonName: this.form.value.commonName,
                    privacy: new HorseProfilePrivacy(Privacy.defaultPrivacy())
                })
            })
        ).pipe(
            take(1),
            tap(data => this._modalController.dismiss(data)),
            finalize(() => this.quickCreating$.next(false)),
        ).subscribe();
    }

    public createWithDetails(): void {
        if (this.form.invalid) {
            this._toastService.error('Check form for errors');
            return;
        }

        this._modalController.dismiss(null);
        this._router.navigate(['tabs', 'horse-profile', 'create-horse'], {
            state: {
                horseName: this.form.value.commonName
            }
        });
    }

    public cancel(): void {
        this.quickCreating$.pipe(
            take(1),
            filter(creating => !creating),
            tap(() =>
                this._modalController.dismiss(null)
            )
        ).subscribe();
    }
}
