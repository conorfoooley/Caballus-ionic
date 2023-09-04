import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

interface IDialogData {
    distance: string;
}

const ZERO: number = 0;

@Component({
    selector: 'caballus-ride-distance-modal',
    templateUrl: './ride-distance-modal.component.html',
    styleUrls: ['./ride-distance-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideDistanceModalComponent implements OnDestroy {
    private _distance: string = '0.00';
    private readonly _onDestroy$: Subject<void> = new Subject();
    private readonly _showSaveModal: Subject<void> = new Subject();
    private readonly _showResetModal: Subject<void> = new Subject();

    public distance: FormControl = new FormControl('0.00', [
        Validators.required,
        Validators.min(ZERO),
        Validators.pattern(/^\d+(\.{1}\d{1,2}){0,1}$/)
    ]);
    public invalid$: Observable<boolean>;

    constructor(
        private readonly _dialogRef: MatDialogRef<RideDistanceModalComponent>,
        private readonly _dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) data: IDialogData
    ) {
        this.invalid$ = this.distance.statusChanges.pipe(
            map(s => s === 'INVALID'),
            shareReplay(1)
        );

        this._distance = this._parseDistance(data.distance);
        this._setControlValues(this._distance);

        this._showSaveModal
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(() => this.saveModal().afterClosed()),
                tap(response => (response ? this._close(this._getControlValue()) : undefined))
            )
            .subscribe();

        this._showResetModal
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(() => this.resetModal().afterClosed()),
                tap(response => (response ? this._close(this._distance, response) : undefined))
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    private _close(distance: string, reset: boolean = false): void {
        this._dialogRef.close({
            changed: reset ? false : this._getControlValue() !== this._distance,
            distance: reset ? this._distance : distance,
            reset
        });
    }

    public cancel(): void {
        this._close(this._distance);
    }

    public assent(): void {
        this._showSaveModal.next();
    }

    public reset(): void {
        this._showResetModal.next();
    }

    private _parseDistance(input: string): string {
        const inputValue: number = Number(input);
        if (Number.isNaN(inputValue)) {
            return '0.00';
        }
        return inputValue.toFixed(2);
    }

    private _setControlValues(input: string): void {
        this.distance.reset(input);
    }

    private _getControlValue(): string {
        return this._parseDistance(this.distance.value);
    }

    private saveModal(): MatDialogRef<ConfirmModalComponent> {
        const dialogRef: MatDialogRef<ConfirmModalComponent> = this._dialog.open(
            ConfirmModalComponent,
            {
                autoFocus: true,
                maxHeight: '90vh',
                data: {
                    title: 'Are you sure?',
                    bodyHtml:
                        'Ride will be visible in the entry but will be marked a manual entry ' +
                        'and the data will not be included in the horse profile statistics.',
                    confirm: 'Yes'
                }
            }
        );
        return dialogRef;
    }

    private resetModal(): MatDialogRef<ConfirmModalComponent> {
        const dialogRef: MatDialogRef<ConfirmModalComponent> = this._dialog.open(
            ConfirmModalComponent,
            {
                autoFocus: true,
                maxHeight: '90vh',
                data: {
                    title: 'Reset to original?',
                    bodyHtml: undefined,
                    confirm: 'Yes'
                }
            }
        );
        return dialogRef;
    }
}
