import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

interface IDialogData {
    duration: string;
}

const ZERO: number = 0;
const PAD_LENGTH: number = 2;
const MAX_LENGTH: number = 2;
const MAX_HOUR: number = 23;
const MAX_MINSEC: number = 59;

@Component({
    selector: 'caballus-ride-duration-modal',
    templateUrl: './ride-duration-modal.component.html',
    styleUrls: ['./ride-duration-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideDurationModalComponent implements OnDestroy {
    private _duration: string = '00:00:00';
    private readonly _onDestroy$: Subject<void> = new Subject();
    private readonly _form: FormGroup;
    private readonly _showSaveModal: Subject<void> = new Subject();
    private readonly _showResetModal: Subject<void> = new Subject();

    public hours: FormControl = new FormControl('00', [
        Validators.required,
        Validators.min(ZERO),
        Validators.max(MAX_HOUR),
        Validators.maxLength(MAX_LENGTH)
    ]);
    public minutes: FormControl = new FormControl('00', [
        Validators.required,
        Validators.min(ZERO),
        Validators.max(MAX_MINSEC),
        Validators.maxLength(MAX_LENGTH)
    ]);
    public seconds: FormControl = new FormControl('00', [
        Validators.required,
        Validators.min(ZERO),
        Validators.max(MAX_MINSEC),
        Validators.maxLength(MAX_LENGTH)
    ]);
    public invalid$: Observable<boolean>;

    constructor(
        private readonly _dialogRef: MatDialogRef<RideDurationModalComponent>,
        private readonly _dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) data: IDialogData
    ) {
        this._form = new FormGroup({
            hours: this.hours,
            minutes: this.minutes,
            seconds: this.seconds
        });

        this.invalid$ = this._form.statusChanges.pipe(
            map(s => s === 'INVALID'),
            shareReplay(1)
        );

        this._duration = this._parseDuration(data.duration);
        this._setFormValues(this._duration);

        this._showSaveModal
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(() => this.saveModal().afterClosed()),
                tap(response => (response ? this._close(this._getFormValue()) : undefined))
            )
            .subscribe();

        this._showResetModal
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(() => this.resetModal().afterClosed()),
                tap(response => (response ? this._close(this._duration, response) : undefined))
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    private _close(duration: string, reset: boolean = false): void {
        this._dialogRef.close({
            changed: reset ? false : this._getFormValue() !== this._duration,
            duration: reset ? this._duration : duration,
            reset
        });
    }

    public cancel(): void {
        this._close(this._duration);
    }

    public assent(): void {
        this._showSaveModal.next();
    }

    public reset(): void {
        this._showResetModal.next();
    }

    private _parseDuration(input: string): string {
        const [hours, minutes, seconds]: string[] = (input || this._duration).split(':');
        return this._toDuration({
            hours: hours || 0,
            minutes: minutes || 0,
            seconds: seconds || 0
        });
    }

    private _setFormValues(input: string): void {
        const [hours, minutes, seconds]: string[] = input.split(':');
        this.hours.reset(hours);
        this.minutes.reset(minutes);
        this.seconds.reset(seconds);
    }

    private _getFormValue(): string {
        return this._toDuration(this._form.value);
    }

    private _toDuration(input: {
        hours: number | string;
        minutes: number | string;
        seconds: number | string;
    }): string {
        return `${this._padZeros(input.hours)}:${this._padZeros(input.minutes)}:${this._padZeros(
            input.seconds
        )}`;
    }

    private _padZeros(input: string | number): string {
        return String(input).padStart(PAD_LENGTH, '0');
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
