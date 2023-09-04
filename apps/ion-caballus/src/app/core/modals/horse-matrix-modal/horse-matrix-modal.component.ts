import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    Input,
    ViewChild,
    ElementRef
} from '@angular/core';
import { ToastService } from '@rfx/ngx-toast';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, forkJoin, iif, of } from 'rxjs';
import { catchError, finalize, switchMap, take, tap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    bytesToMB,
    Media,
    HorseMatrixSimple,
    HorseMatrixType,
    HorseService,
    HORSE_MATRIX_INFO,
    ModalService,
    HorseEvaluationType,
    HorseEvaluationSimple
} from '@caballus/ui-common';
import { Options } from '@angular-slider/ngx-slider';

const INVALID_FILE_WARNING =
    'Allowed filesized (50Mb) exceeded or an incorrect format and will not be uploaded. Upload failed';

const MAX_ATTACHMENT_WARNING = 'Allowed maximum 2 attachments';
const TARGET_BLANK = '_blank';
const MAX_FILE_SIZE_IN_MB = 50;
const MAXIMUM_FILES = 2;
const MAXIMUM_NOTES_LENGTH = 250;
const MAX_FILE_NAME_LENGTH = 14;
const ACCEPTS_FILE_TYPES = [
    '.jpg',
    '.jpeg',
    '.png',
    '.pdf',
    '.doc',
    '.docx',
    '.pages',
    '.epub',
    '.txt',
    '.rtf',
    '.zip',
    '.mov',
    '.mp4'
];
const SLIDER_OPTIONS: Options = {
    showTicksValues: true,
    stepsArray: [
        { value: 0 },
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
        { value: 6 },
        { value: 7 },
        { value: 8 },
        { value: 9 },
        { value: 10 }
    ]
};
const READ_ONLY_SLIDER_OPTIONS: Options = { ...SLIDER_OPTIONS, readOnly: true };
const DEFAULT_RATING = 5;

@Component({
    selector: 'app-horse-matrix-modal',
    templateUrl: './horse-matrix-modal.component.html',
    styleUrls: ['./horse-matrix-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseMatrixModalComponent implements OnInit {
    public notesLength: number = MAXIMUM_NOTES_LENGTH;
    @Input()
    public horseMatrix!: HorseMatrixSimple;
    @Input()
    public evaluationType!: HorseEvaluationType;
    @Input()
    public isPastEditEvaluationDeadline$!: boolean;
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public horseMatrixForm: FormGroup = this._formBuilder.group({
        horseMatrixType: ['', Validators.required],
        rating: [DEFAULT_RATING],
        notes: ['', Validators.maxLength(MAXIMUM_NOTES_LENGTH)]
    });
    public validations = {
        notes: [
            {
                type: 'maxlength',
                message: `Notes cannot be more than ${MAXIMUM_NOTES_LENGTH} characters long.`
            }
        ]
        // other validations
    };
    public newDocuments$: BehaviorSubject<File[]> = new BehaviorSubject([]);
    public existingDocuments$: BehaviorSubject<Media[]> = new BehaviorSubject([]);
    @ViewChild('fileElement', { static: false })
    public fileElement: ElementRef;
    public sliderOptions: Options = SLIDER_OPTIONS;
    public readonlySliderOptions: Options = READ_ONLY_SLIDER_OPTIONS;
    public readonly HorseMatrixType: typeof HorseMatrixType = HorseMatrixType;
    public readonly horseMatrixInfo: typeof HORSE_MATRIX_INFO = HORSE_MATRIX_INFO;
    private _isUploadFormDirty$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public existingDocumentsDeleting$: BehaviorSubject<Record<string, boolean>> =
        new BehaviorSubject({});
    public selectedImage$: BehaviorSubject<string | null> = new BehaviorSubject(null);
    public readonly HorseEvaluationType: typeof HorseEvaluationType = HorseEvaluationType;
    public isLocked$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _modalController: ModalController,
        private readonly _horseService: HorseService,
        private readonly _toastService: ToastService,
        private readonly _formBuilder: FormBuilder,
        private readonly _modalService: ModalService
    ) {}

    public ngOnInit(): void {
        this.isLocked$.next(this.isPastEditEvaluationDeadline$);

        this.horseMatrixForm.patchValue({
            horseMatrixType: this.horseMatrix.horseMatrixType,
            rating: this.horseMatrix.rating || DEFAULT_RATING,
            notes: this.horseMatrix.notes || ''
        });
        if (this.horseMatrix.documents?.length) {
            this.existingDocuments$.next(
                this.horseMatrix.documents.map(({ latest, ...rest }) => ({
                    ...rest,
                    latest,
                    displayName: this.displayFileName(latest.name)
                }))
            );
        }
        if (this.horseMatrix.newDocuments?.length) {
            this.newDocuments$.next(this.horseMatrix.newDocuments);
        }
    }

    public onSave(): void {
        if (
            this.horseMatrixForm.get('notes').errors &&
            this.horseMatrixForm.get('notes').errors.maxlength &&
            this.horseMatrixForm.invalid
        ) {
            this._toastService.error('Not all required fields have been completed');
            return;
        }
        forkJoin([this.newDocuments$.pipe(take(1)), this.existingDocuments$.pipe(take(1))])
            .pipe(
                take(1),
                tap(([documents, existingDocuments]) => {
                    this._modalController.dismiss({
                        saved: true,
                        horseId: this.horseMatrix?.horseIdentity?._id,
                        horseMatrixType: this.horseMatrixForm.value.horseMatrixType,
                        notes: this.horseMatrixForm.value.notes,
                        rating: this.horseMatrixForm.value.rating,
                        documents,
                        existingDocuments
                    });
                })
            )
            .subscribe();
    }

    public goBack(): void {
        if (this.horseMatrixForm.dirty || this._isUploadFormDirty$.getValue()) {
            this._modalService
                .openActionDialog(
                    'Save Changes',
                    'There have been changes to this item.  Do you wish to save those changes?',
                    'Save',
                    'Discard'
                )
                .afterClosed()
                .pipe(
                    take(1),
                    tap(button => {
                        if (button && button === 'Button1') {
                            this.onSave();
                        } else {
                            this._modalController.dismiss({ saved: false, deleted: false });
                        }
                    })
                )
                .subscribe();
        } else {
            this._modalController.dismiss({ saved: false, deleted: false });
        }
    }

    public onFilesAdded(e: Event): void {
        const target = e.target as HTMLInputElement;
        const fileList = target.files;
        const files = Array.from(fileList) as File[];
        if (this._isValidFiles(files)) {
            this.newDocuments$.next([...this.newDocuments$.getValue(), ...files]);
            this.fileElement.nativeElement.value = null;
            this._isUploadFormDirty$.next(true);
        }
    }

    private _isValidFiles(files): boolean {
        if (
            this.existingDocuments$.getValue().length +
                this.newDocuments$.getValue().length +
                files.length >
            MAXIMUM_FILES
        ) {
            this._toastService.error(MAX_ATTACHMENT_WARNING);
            this.fileElement.nativeElement.value = null;
            return false;
        }
        const validFileTypes = files.every(file => {
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
        });
        if (!validFileTypes) {
            this._toastService.error(INVALID_FILE_WARNING);
            this.fileElement.nativeElement.value = null;
            return false;
        }
        return validFileTypes;
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

    public deleteNewDocument(deletedIndex: number, fileName: string): void {
        this._modalService
            .openActionDialog(
                'Remove File',
                `Do you want to remove this attachment ${fileName}?`,
                'Remove',
                'Keep'
            )
            .afterClosed()
            .pipe(
                switchMap(button =>
                    iif(
                        () => button && button === 'Button1',
                        this.newDocuments$.pipe(take(1)),
                        of(null)
                    )
                ),
                tap((documents: File[] | null) => {
                    if (documents) {
                        documents.splice(deletedIndex, 1);
                        this.newDocuments$.next(documents);
                    }
                })
            )
            .subscribe();
    }

    public deleteExistingDocument(id: string, fileName: string, index: number): void {
        this.existingDocumentsDeleting$.next({
            [index]: true
        });
        this._modalService
            .openActionDialog(
                'Remove File',
                `Do you want to remove this attachment ${fileName}?`,
                'Remove',
                'Keep'
            )
            .afterClosed()
            .pipe(
                switchMap(button =>
                    iif(
                        () => button && button === 'Button1',
                        this._horseService
                            .deleteHorseHealthDocument(id, this.horseMatrix?.horseIdentity?._id)
                            .pipe(take(1)),
                        of(true)
                    )
                ),
                tap(isDiscard => {
                    if (!isDiscard) {
                        this.existingDocuments$.next(
                            this.existingDocuments$.getValue().filter(({ _id }) => _id !== id)
                        );
                        this.isLoading$.next(false);
                    }
                    this.existingDocumentsDeleting$.next({});
                }),
                catchError(() => {
                    this._toastService.error('Error deleting horse health document');
                    return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
            )
            .subscribe();
    }

    public setPreviewImage(imgUrl: string | null): void {
        this.selectedImage$.next(imgUrl);
    }

    public previewSelectedFile(file: File): void {
        window.open(URL.createObjectURL(file), TARGET_BLANK);
    }

    public previewExistingFile(doc: Media): void {
        window.open(doc.latest.url, TARGET_BLANK);
    }
}
