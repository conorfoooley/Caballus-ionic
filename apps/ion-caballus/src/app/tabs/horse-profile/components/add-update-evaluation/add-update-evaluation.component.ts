import { Component, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
    HorseEvaluationSimple,
    HorseEvaluationType,
    HorseMatrixSimple,
    HorseMatrixToShow,
    HorseService,
    Media,
    ModalService
} from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService as IonModalService } from '@ion-caballus/core/services';
import { HorseMatrixType } from '@caballus/ui-common';
import { isEqual } from 'lodash';
import { IonContent } from '@ionic/angular';
import { DataService } from '@ion-caballus/core/services/data-service';

const SCROLL_TO_TOP_DURATION = 100;

@Component({
    selector: 'app-add-update-evaluation',
    templateUrl: './add-update-evaluation.component.html',
    styleUrls: ['./add-update-evaluation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditEvaluationComponent implements OnInit {
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public evaluationId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('evaluationId')),
        shareReplay(1)
    );
    public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public horseEvaluationForm: FormGroup = this._formBuilder.group({
        date: ['', Validators.required],
        evaluator: ['', Validators.required],
        location: ['', Validators.required],
        evaluationType: ['', Validators.required],
        custom: ['']
    });
    public validations = {
        date: [{ type: 'required', message: 'Date is required.' }],
        evaluator: [{ type: 'required', message: 'Evaluator is required.' }],
        evaluationType: [{ type: 'required', message: 'Evaluation type is required.' }],
        custom: [{ type: 'required', message: 'Custom type is required.' }],
        location: [{ type: 'required', message: 'Location is required.' }]
        // other validations
    };
    public matrixItems$: BehaviorSubject<Record<string, HorseMatrixSimple>> = new BehaviorSubject(
        {}
    );
    private _previousMatrixItems$: BehaviorSubject<Record<string, HorseMatrixSimple>> =
        new BehaviorSubject({});
    public readonly HorseMatrixType: typeof HorseMatrixType = HorseMatrixType;
    public readonly HorseEvaluationType: typeof HorseEvaluationType = HorseEvaluationType;
    public isLoadingMatrix$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isDeleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public horseMatrixToShow: {
        title: string;
        types: Array<HorseMatrixType | string>;
        typesAreEmpty: boolean;
    }[] = [];
    @ViewChild('content', { static: false })
    public content: IonContent;
    public evaluationType!: HorseEvaluationType;
    public horseEvaluation!: HorseEvaluationSimple;
    public horseEvaluationCustomMatrixControl = new FormControl('', [Validators.required]);
    public isPastEditEvaluationDeadline$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public isLocked$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
        private readonly _formBuilder: FormBuilder,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _modalService: ModalService,
        private readonly _ionModalService: IonModalService,
        private readonly _router: Router,
        private readonly _horseService: HorseService,
        private readonly _dataService: DataService
    ) {}

    public ngOnInit(): void {
        this.matrixItems$.next({});
        const horseEvaluation: HorseEvaluationSimple = this._router.getCurrentNavigation().extras
            .state?.horseEvaluation as HorseEvaluationSimple;
        this.evaluationType = this._router.getCurrentNavigation().extras.state
            ?.evaluationType as HorseEvaluationType;
        this.horseEvaluation = horseEvaluation;
        if (horseEvaluation?.createdDate) {
            const currentDate = new Date();
            const createdDate = new Date(horseEvaluation.createdDate);
            const diffTime = Math.abs(createdDate.getTime() - currentDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.isPastEditEvaluationDeadline$.next(diffDays > 3);
        } else {
            this.isPastEditEvaluationDeadline$.next(false);
        }
        this.isLocked$.next(!!horseEvaluation?.isLocked);
        this.horseEvaluationForm.patchValue({
            date: horseEvaluation?.date || '',
            evaluator: horseEvaluation?.evaluator || '',
            location: horseEvaluation?.location || '',
            evaluationType: this.evaluationType
        });

        const matrixItems = {};
        this.horseMatrixToShow = [];
        HorseMatrixToShow[this.evaluationType].forEach(matrix => {
            this.horseMatrixToShow.push({
                title: matrix.title,
                types: [...matrix.types, 'Custom'],
                typesAreEmpty: true
            });
        });

        this.horseMatrixToShow.forEach(({ types, title }) => {
            types.forEach(horseMatrixType => {
                matrixItems[horseMatrixType] = new HorseMatrixSimple({
                    horseMatrixType: horseMatrixType as HorseMatrixType,
                    rating: null,
                    notes: '',
                    documents: [],
                    newDocuments: [],
                    isCustom: horseMatrixType === 'Custom',
                    horseMatrixGroupTitle: title
                });
            });
        });

        this.matrixItems$.next({
            ...matrixItems
        });

        this._getHorseEvaluationMatrixByEvaluationId();
    }

    private _getHorseEvaluationMatrixByEvaluationId(): void {
        this.isLoadingMatrix$.next(true);
        const matrixItems = this.matrixItems$.getValue();
        forkJoin([this.evaluationId$.pipe(take(1)), this._horseId$.pipe(take(1))])
            .pipe(
                take(1),
                switchMap(([evaluationId, horseId]) =>
                    iif(
                        () => !!evaluationId,
                        this._horseService.getHorseEvaluationMatrixByEvaluationId(
                            evaluationId,
                            horseId
                        ),
                        of([])
                    )
                ),
                tap((items: HorseMatrixSimple[]) => {
                    items.forEach(item => {
                        const horseMatrixShowIndex = this.horseMatrixToShow.findIndex(
                            m => m.title.toLowerCase() === item.horseMatrixGroupTitle.toLowerCase()
                        );

                        if (matrixItems[item.horseMatrixType]) {
                            matrixItems[item.horseMatrixType] = {
                                ...matrixItems[item.horseMatrixType],
                                ...item
                            };
                            // check to see if item has rating
                            if (item.rating) {
                                this.horseMatrixToShow[horseMatrixShowIndex].typesAreEmpty = false;
                            }
                        } else {
                            matrixItems[item.horseMatrixType] = {
                                ...item
                            };
                            // add the custom matrix type to the appropriate matrix group
                            if (horseMatrixShowIndex > -1) {
                                // add the custom matrix to the group as a second last index so a user can add new custom matrix types after the custom matrix type
                                this.horseMatrixToShow[horseMatrixShowIndex].types.splice(
                                    this.horseMatrixToShow[horseMatrixShowIndex].types.length - 1,
                                    0,
                                    item.horseMatrixType as HorseMatrixType
                                );
                            } else {
                                // add the custom matrix type to the end of the array
                                this.horseMatrixToShow[
                                    this.horseMatrixToShow.length - 1
                                ].types.push(item.horseMatrixType as HorseMatrixType);
                            }
                            // check to see if item has rating
                            if (item.rating) {
                                this.horseMatrixToShow[horseMatrixShowIndex].typesAreEmpty = false;
                            }
                        }
                    });
                    this.matrixItems$.next({ ...matrixItems });
                    this._previousMatrixItems$.next({ ...matrixItems });
                    this.isLoadingMatrix$.next(false);
                })
            )
            .subscribe();
    }

    public onSave(): void {
        if (this.horseEvaluationForm.invalid) {
            this._toastService.error('Not all required fields have been completed');
            this.content.scrollToTop(SCROLL_TO_TOP_DURATION);
            return;
        }

        this.isLoading$.next(true);
        forkJoin([this.evaluationId$.pipe(take(1)), this._horseId$.pipe(take(1))])
            .pipe(
                take(1),
                switchMap(([evaluationId, horseId]) =>
                    iif(
                        () => !!evaluationId,
                        this._horseCache.editHorseEvaluation(evaluationId, horseId, {
                            evaluator: this.horseEvaluationForm.value.evaluator,
                            location: this.horseEvaluationForm.value.location,
                            date: this.horseEvaluationForm.value.date,
                            evaluationType: this.horseEvaluationForm.value.evaluationType
                        }),
                        this._horseCache.createHorseEvaluation(horseId, {
                            evaluator: this.horseEvaluationForm.value.evaluator,
                            location: this.horseEvaluationForm.value.location,
                            date: this.horseEvaluationForm.value.date,
                            evaluationType: this.horseEvaluationForm.value.evaluationType
                        })
                    )
                ),
                switchMap(evaluationId =>
                    iif(
                        () => !!evaluationId,
                        forkJoin([of(evaluationId as string), this._horseId$.pipe(take(1))]),
                        forkJoin([this.evaluationId$.pipe(take(1)), this._horseId$.pipe(take(1))])
                    )
                ),
                switchMap(([evaluationId, horseId]) =>
                    forkJoin(
                        Object.values(this.matrixItems$.getValue())
                            .filter(
                                item =>
                                    !isEqual(
                                        this._previousMatrixItems$.getValue()[item.horseMatrixType],
                                        item
                                    ) ||
                                    (typeof item.rating === 'undefined' &&
                                        !isEqual(
                                            this._previousMatrixItems$.getValue()[
                                                item.horseMatrixType
                                            ]?.horseMatrixType,
                                            item.horseMatrixType
                                        ) &&
                                        !HorseMatrixType.toString(
                                            item.horseMatrixType as HorseMatrixType
                                        ))
                            )
                            .map(
                                ({
                                    newDocuments,
                                    horseMatrixType,
                                    rating,
                                    notes,
                                    horseMatrixGroupTitle
                                }) =>
                                    this._horseService.createUpdateHorseEvaluationMatrix(
                                        {
                                            horseId,
                                            evaluationId,
                                            horseMatrixType,
                                            notes,
                                            rating,
                                            horseMatrixGroupTitle
                                        },
                                        newDocuments
                                    )
                            )
                    ).pipe(defaultIfEmpty([]))
                ),
                tap(() => this.goBack(true)),
                catchError(() => {
                    this._toastService.error('Error updating horse evaluation');
                    return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
            )
            .subscribe();
    }

    public deleteHorseEvaluation(): void {
        this._modalService
            .openActionDialog(
                'Confirm Delete',
                'Are you sure you want to delete this Evaluation?',
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
                            this.evaluationId$.pipe(take(1)),
                            this._horseId$.pipe(take(1))
                        ]);
                    }
                    return of([]);
                }),
                switchMap(data => {
                    if (data?.length) {
                        return this._horseCache.deleteHorseEvaluationById(data[0], data[1]);
                    }
                    return of(true);
                }),
                tap(isDiscard => {
                    if (!isDiscard) {
                        this._toastService.success('Horse evaluation is deleted');
                        this.goBack(true);
                    }
                }),
                catchError(() => {
                    this._toastService.error('Error deleting horse evaluation');
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
                        [`/tabs/horse-profile/detail-horse/evaluations/${horseId}`],
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

    public goBackToEvaluation(): void {
        if (!this.horseEvaluationForm.dirty) {
            return this.goBack();
        }
        this._modalService
            .openActionDialog(
                'Unsaved Changes',
                `Items have not been saved.  Do you want to save changes to this ${
                    this.horseEvaluationForm.value.evaluationType ===
                    HorseEvaluationType.Conformation
                        ? 'Conformation Matrix'
                        : 'Performance Evaluation'
                } before leaving?`,
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

    public goToHorseMatrixModal(type: HorseMatrixType): void {
        const matrixItems = this.matrixItems$.getValue();
        const horseMatrix = matrixItems[type];
        this._horseId$
            .pipe(
                switchMap(id =>
                    iif(
                        () => !!id,
                        this._ionModalService.addEditHorseMatrixModal(
                            horseMatrix,
                            this.horseEvaluationForm.value.evaluationType,
                            this.isPastEditEvaluationDeadline$.getValue()
                        ),
                        of(null)
                    )
                ),
                map(
                    ({
                        saved,
                        horseMatrixType,
                        notes,
                        rating,
                        documents,
                        existingDocuments
                    }: {
                        saved: boolean;
                        horseMatrixType: HorseMatrixType | string;
                        notes: string;
                        rating: number;
                        documents: File[];
                        existingDocuments: Media[];
                        index: number;
                    }) => {
                        if (saved) {
                            const matrixItems = { ...this.matrixItems$.getValue() };
                            matrixItems[horseMatrixType] = new HorseMatrixSimple({
                                ...matrixItems[horseMatrixType],
                                horseMatrixType,
                                notes,
                                rating,
                                newDocuments: documents,
                                documents: existingDocuments
                            });
                            this.matrixItems$.next({ ...matrixItems });
                        }
                    }
                )
            )
            .subscribe();
    }

    public onAddCustomHorseHealthType(horseMatrixTypeTitle: string): void {
        if (!this.horseEvaluationCustomMatrixControl.value.trim().length) {
            return;
        }

        const matrixItems = { ...this.matrixItems$.getValue() };
        for (const matrixItem in matrixItems) {
            if (
                matrixItem.toLowerCase().trim() ===
                this.horseEvaluationCustomMatrixControl.value.toLowerCase().trim()
            ) {
                this._toastService.error('This custom matrix already exist');
                return;
            }
        }

        matrixItems[this.horseEvaluationCustomMatrixControl.value] = new HorseMatrixSimple({
            horseMatrixType: this.horseEvaluationCustomMatrixControl.value,
            notes: '',
            rating: null,
            newDocuments: [],
            documents: [],
            isCustom: false,
            horseMatrixGroupTitle: horseMatrixTypeTitle
        });

        this.matrixItems$.next({ ...matrixItems });

        // find the index where the custom matrix is added
        const horseMatrixShowIndex = this.horseMatrixToShow.findIndex(
            m => m.title.toLowerCase() === horseMatrixTypeTitle.toLowerCase()
        );
        this.horseMatrixToShow[horseMatrixShowIndex].types.splice(
            this.horseMatrixToShow[horseMatrixShowIndex].types.length - 1,
            0,
            this.horseEvaluationCustomMatrixControl.value
        );

        // reset the horseEvaluationCustomMatrixControl
        this.horseEvaluationCustomMatrixControl.patchValue('');
        this.horseEvaluationCustomMatrixControl.markAsUntouched();
        this.horseEvaluationCustomMatrixControl.markAsPristine();
    }

    public onDeleteCustomMatrix(
        event: MouseEvent,
        horseMatrixTypeTitle: string,
        matrixItem: string
    ): void {
        event.stopPropagation();

        const horseMatrixShowIndex = this.horseMatrixToShow.findIndex(
            m => m.title.toLowerCase() === horseMatrixTypeTitle.toLowerCase()
        );

        const typeIndex = this.horseMatrixToShow[horseMatrixShowIndex].types.findIndex(
            m => m === matrixItem
        );
        const matrixItems = { ...this.matrixItems$.getValue() };

        this._modalService
            .openActionDialog(
                'Delete Custom Matrix',
                `Do you want to delete custom matrix?`,
                'No, Go Back',
                'Yes, Delete'
            )
            .afterClosed()
            .pipe(
                take(1),
                switchMap(button => {
                    if (button && button === 'Button2') {
                        this.isDeleting$.next(true);
                        return this._horseId$;
                    }
                    return of(false);
                }),
                switchMap(horseId =>
                    iif(
                        () => !!horseId && !!matrixItems[matrixItem]._id,
                        this._horseService.deleteHorseMatrixById(
                            String(horseId),
                            matrixItems[matrixItem]._id
                        ),
                        of({
                            isDiscard: !horseId
                        })
                    )
                ),
                tap(isDiscard => {
                    if (!isDiscard || !isDiscard.isDiscard) {
                        delete matrixItems[matrixItem];
                        this.matrixItems$.next({ ...matrixItems });
                        this._previousMatrixItems$.next({ ...matrixItems });
                        this.horseMatrixToShow[horseMatrixShowIndex].types.splice(typeIndex, 1);
                        this._toastService.success('Horse custom matrix is deleted');
                    }
                    this.isDeleting$.next(false);
                }),
                catchError(() => {
                    this._toastService.error('Error deleting horse custom matrix');
                    return of(null);
                })
            )
            .subscribe();
    }

    public showHideSubMenu(): void {
        this._dataService.setCheckedValue(false);
    }
}
