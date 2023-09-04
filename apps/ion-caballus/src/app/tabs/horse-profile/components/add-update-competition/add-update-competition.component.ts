import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, forkJoin, iif, Observable, of } from 'rxjs';
import {
    catchError,
    defaultIfEmpty,
    finalize,
    map,
    shareReplay,
    switchMap,
    take,
    tap
} from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    HorseCompetitionSimple,
    HorseService,
    Media,
    ModalService,
    bytesToMB,
    GalleryService,
    GalleryCategory,
    BaseMediaDocument
} from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService as IonModalService } from '@ion-caballus/core/services';

const INVALID_FILE_WARNING =
    'Allowed filesized (50Mb) exceeded or an incorrect format and will not be uploaded. Upload failed';

const FILE_ATTACHMENT_WARNING = 'Upload a image file.';

const MAX_FILE_SIZE_IN_MB = 50;
const MAX_FILE_NAME_LENGTH = 14;
const ACCEPTS_FILE_TYPES = ['.jpg', '.jpeg', '.png'];

@Component({
    selector: 'app-add-update-competition',
    templateUrl: './add-update-competition.component.html',
    styleUrls: ['./add-update-competition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditCompetitionComponent implements OnInit {
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public competitionId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('competitionId')),
        shareReplay(1)
    );
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public horseCompetitionForm: FormGroup = this._formBuilder.group({
        name: ['', Validators.required],
        date: ['', Validators.required],
        location: ['', Validators.required],
        results: ['', Validators.required],
        notes: ['', Validators.required]
    });

    public validations = {
        date: [{ type: 'required', message: 'Date is required.' }],
        name: [{ type: 'required', message: 'Name is required.' }],
        results: [{ type: 'required', message: 'Result is required.' }],
        notes: [{ type: 'required', message: 'Note is required.' }],
        location: [{ type: 'required', message: 'Location is required.' }]
        // other validations
    };

    public isDeleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    @ViewChild('fileElement', { static: true })
    public fileElement: ElementRef;
    constructor(
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _formBuilder: FormBuilder,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _modalService: ModalService,
        private readonly _ionModalService: IonModalService,
        private readonly _galleryService: GalleryService,
        private readonly _router: Router,
        private readonly _horseService: HorseService
    ) {}

    public attachedImage: File | undefined = undefined;
    public horseCompetitionImageName: string = '';
    public attachedImageUrl: string = '';
    public removeImage: boolean = false;

    public ngOnInit(): void {
        const horseCompetition: HorseCompetitionSimple = this._router.getCurrentNavigation().extras
            .state?.horseCompeition as HorseCompetitionSimple;
        this.horseCompetitionForm.patchValue({
            name: horseCompetition?.name || '',
            date: horseCompetition?.date || '',
            location: horseCompetition?.location || '',
            results: horseCompetition?.results || '',
            notes: horseCompetition?.notes || ''
        });
        this.horseCompetitionImageName = horseCompetition?.image?.name;
    }

    public onSave(): void {
        if (this.horseCompetitionForm.invalid) {
            return;
        }

        forkJoin([this.competitionId$.pipe(take(1)), this._horseId$.pipe(take(1))])
            .pipe(
                take(1),
                switchMap(([competitionId, horseId]) =>
                    iif(
                        () => !!competitionId,
                        this._horseCache.editHorseCompetition(
                            competitionId,
                            horseId,
                            {
                                name: this.horseCompetitionForm.value.name,
                                results: this.horseCompetitionForm.value.results,
                                notes: this.horseCompetitionForm.value.notes,
                                location: this.horseCompetitionForm.value.location,
                                date: this.horseCompetitionForm.value.date
                            },
                            this.removeImage,
                            this.attachedImage
                        ),
                        this._horseCache.createHorseCompetition(
                            horseId,
                            {
                                name: this.horseCompetitionForm.value.name,
                                results: this.horseCompetitionForm.value.results,
                                notes: this.horseCompetitionForm.value.notes,
                                location: this.horseCompetitionForm.value.location,
                                date: this.horseCompetitionForm.value.date
                            },
                            this.attachedImage
                        )
                    )
                ),
                switchMap(competitionId =>
                    iif(
                        () => !!competitionId,
                        forkJoin([of(competitionId as string), this._horseId$.pipe(take(1))]),
                        forkJoin([this.competitionId$.pipe(take(1)), this._horseId$.pipe(take(1))])
                    )
                ),
                tap(() => this.goBack(true)),
                catchError(() => {
                    this._toastService.error('Error updating horse competition');
                    return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
            )
            .subscribe();
    }

    public deleteHorseCompetition(): void {
        this._modalService
            .openActionDialog(
                'Confirm Delete',
                'Are you sure you want to delete this Competition?',
                'No, Go Back',
                'Yes, Delete'
            )
            .afterClosed()
            .pipe(
                take(1),
                switchMap(button => {
                    if (button && button === 'Button2') {
                        this.isDeleting$.next(true);
                        return forkJoin([
                            this.competitionId$.pipe(take(1)),
                            this._horseId$.pipe(take(1))
                        ]);
                    }
                    return of([]);
                }),
                switchMap(data => {
                    if (data?.length) {
                        return this._horseCache.deleteHorseCompetitionById(data[0], data[1]);
                    }
                    return of(true);
                }),
                tap(isDiscard => {
                    if (!isDiscard) {
                        this._toastService.success('Horse competition is deleted');
                        this.goBack(true);
                    }
                }),
                catchError(() => {
                    this._toastService.error('Error deleting horse competition');
                    return of(null);
                }),
                finalize(() => this.isDeleting$.next(false))
            )
            .subscribe();
    }

    public goBack(doRefresh?: boolean): void {
        this._horseId$
            .pipe(
                tap(horseId => {
                    this._router.navigate(
                        [`/tabs/horse-profile/detail-horse/competitions/${horseId}`],
                        {
                            queryParams: {
                                doRefresh
                            }
                        }
                    );
                })
            )
            .subscribe();
    }

    public goBackToCompetition(): void {
        if (!this.horseCompetitionForm.dirty) {
            return this.goBack();
        }
        this._modalService
            .openActionDialog(
                'Unsaved Changes',
                'Items have not been saved.  Do you want to save changes to this competition before leaving?',
                'Yes, Save Changes',
                'No, Discard Changes'
            )
            .afterClosed()
            .pipe(
                take(1),
                tap(button => {
                    if (button && button === 'Button1') {
                        this.onSave();
                    } else {
                        this.goBack();
                    }
                })
            )
            .subscribe();
    }

    private _isValidFile(file: File): boolean {
        const splits = file.name.split('.');
        let ext = splits[splits.length - 1];
        if (typeof ext === 'undefined') {
            ext = '';
        }
        if (!ACCEPTS_FILE_TYPES.includes('.' + ext)) {
            return false;
        }
        if (bytesToMB(file.size) > MAX_FILE_SIZE_IN_MB) {
            return false;
        }
        return true;
    }

    public displayFileName(fileName: string): string {
        let displayName = fileName;
        if (fileName.length > MAX_FILE_NAME_LENGTH) {
            const fileNameArr = fileName.split('.');
            const ext = fileNameArr.pop();
            displayName = fileNameArr.join('.').substr(0, MAX_FILE_NAME_LENGTH) + '...' + ext;
        }
        return displayName;
    }

    public onFilesAdded(e: Event) {
        const element = e.currentTarget as HTMLInputElement;
        let fileList: FileList | null = element.files;
        if (this._isValidFile(fileList[0])) {
            this.attachedImage = fileList[0];
            this.attachedImageUrl = URL.createObjectURL(this.attachedImage);
            this.horseCompetitionImageName = undefined;
        } else {
            this._toastService.error(INVALID_FILE_WARNING);
            element.value = null;
        }
    }

    public deleteImage() {
        this.attachedImage = undefined;
        this.fileElement.nativeElement.value = null;
    }

    public deleteImageName() {
        this.horseCompetitionImageName = undefined;
        this.removeImage = true;
    }
}
