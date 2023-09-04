import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HorseDetails, Privacy, HorseProfilePrivacy, HorseService } from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { ModalService } from '@ion-caballus/core/services';
import _ from 'lodash';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
    catchError,
    debounceTime,
    filter,
    map,
    shareReplay,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import { ToastService } from '@rfx/ngx-toast';

@Component({
    selector: 'app-public-permissions',
    templateUrl: './public-permissions.component.html',
    styleUrls: ['./public-permissions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicPermissionsComponent implements OnInit {
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public horse$: BehaviorSubject<HorseDetails> = new BehaviorSubject(null);
    public privacyOptions: { value: Privacy; text: string }[] = Privacy.members.map(m => ({
        value: m,
        text: Privacy.toString(m)
    }));

    public form: FormGroup = this._formBuilder.group({
        overallPrivacy: [null, Validators.required],
        bio: [null, Validators.required],
        media: [null, Validators.required],
        rideHistory: [null, Validators.required],
        studentsAndTrainers: [null, Validators.required],
        ownerDetails: [null, Validators.required],
        gaitTotals: [null, Validators.required],
        gaitSettings: [null, Validators.required],
        medicalHistory: [null, Validators.required],
        performanceEvaluations: [null, Validators.required],
        competitions: [null, Validators.required]
    });

    private _onDestroy$: Subject<void> = new Subject();

    constructor(
        private readonly _router: Router,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _modalService: ModalService,
        private readonly _formBuilder: FormBuilder,
        private readonly _horseService: HorseService
    ) {
    }

    public ngOnInit(): void {
        this.form
            .get('overallPrivacy')
            .valueChanges.pipe(
            // eslint-disable-next-line no-magic-numbers
            debounceTime(100),
            takeUntil(this._onDestroy$),
            tap(val => {
                if (val === Privacy.Private) {
                    this._toastService.error(
                        'While private, the only details seen by the public are the name, image, and a message.'
                    );
                    this.form.get('bio').disable();
                    this.form.get('media').disable();
                    this.form.get('rideHistory').disable();
                    this.form.get('studentsAndTrainers').disable();
                    this.form.get('ownerDetails').disable();
                    this.form.get('gaitTotals').disable();
                    this.form.get('gaitSettings').disable();
                    this.form.get('medicalHistory').disable();
                    this.form.get('performanceEvaluations').disable();
                    this.form.get('competitions').disable();
                } else {
                    this.form.get('bio').enable();
                    this.form.get('media').enable();
                    this.form.get('rideHistory').enable();
                    this.form.get('studentsAndTrainers').enable();
                    this.form.get('ownerDetails').enable();
                    this.form.get('gaitTotals').enable();
                    this.form.get('gaitSettings').enable();
                    this.form.get('medicalHistory').enable();
                    this.form.get('performanceEvaluations').enable();
                    this.form.get('competitions').enable();
                }
            })
        )
            .subscribe();

        this._horseId$
            .pipe(
                take(1),
                filter(id => !!id),
                switchMap(id => this._horseCache.getHorse(id)),
                tap(h => {
                    this.horse$.next(h);
                    this._loadPrivacyForm(h.profile.privacy);
                })
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    private _loadPrivacyForm(privacy: HorseProfilePrivacy): void {
        const asBools = {};
        for (const key in privacy) {
            asBools[key] = privacy[key] === Privacy.Public;
        }
        this.form.patchValue({
            ...asBools,
            overallPrivacy: privacy.overallPrivacy
        });
    }

    private _formToPrivacy(): HorseProfilePrivacy {
        const formVal = this.form.getRawValue();
        const asPrivacy = {};
        for (const key in formVal) {
            asPrivacy[key] = formVal[key] === true ? Privacy.Public : Privacy.Private;
        }
        return new HorseProfilePrivacy({
            ...asPrivacy,
            overallPrivacy: formVal.overallPrivacy
        });
    }

    public backToPublicPermissions(): void {
        if (!this.form.pristine) {
            this._modalService
                .unsavedChangesModal()
                .pipe(
                    filter(confirmed => !!confirmed),
                    switchMap(() => this._horseId$),
                    take(1),
                    switchMap(id =>
                        this._router.navigateByUrl(
                            `/tabs/horse-profile/detail-horse/invites-permissions/${id}`
                        )
                    )
                )
                .subscribe();
        } else {
            this._horseId$
                .pipe(
                    take(1),
                    filter(id => !!id),
                    switchMap(id =>
                        this._router.navigateByUrl(
                            `/tabs/horse-profile/detail-horse/invites-permissions/${id}`
                        )
                    )
                )
                .subscribe();
        }
    }

    public restoreDefaultPrivacy(): void {
        this._loadPrivacyForm(new HorseProfilePrivacy(Privacy.defaultPrivacy()));
    }

    public savePrivacy(horseId: string): void {
        const update = this._formToPrivacy();
        this._horseCache
            .editHorsePrivacy(horseId, update)
            .pipe(
                tap(() => this._router.navigateByUrl(
                    `/tabs/horse-profile/detail-horse/invites-permissions/${horseId}`
                )),
                catchError(err => {
                    console.log(err);
                    this._toastService.error(err);
                    return of(null);
                })
            )
            .subscribe();
    }
}
