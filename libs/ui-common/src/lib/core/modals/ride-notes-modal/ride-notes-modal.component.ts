import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

interface IDialogData {
    notes: string;
}

const ZERO: number = 0;
const MAXIMUM_NOTES_LENGTH = 250;
@Component({
    selector: 'caballus-ride-notes-modal',
    templateUrl: './ride-notes-modal.component.html',
    styleUrls: ['./ride-notes-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideNotesModalComponent implements OnDestroy {
    private _notes: string = '';
    private readonly _onDestroy$: Subject<void> = new Subject();
    private readonly _showCancelModal: Subject<void> = new Subject();

    public notes: FormControl = new FormControl('', [Validators.maxLength(MAXIMUM_NOTES_LENGTH)]);
    public invalid$: Observable<boolean>;

    constructor(
        private readonly _dialogRef: MatDialogRef<RideNotesModalComponent>,
        private readonly _dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) data: IDialogData
    ) {
        this.invalid$ = this.notes.statusChanges.pipe(
            map(s => s === 'INVALID'),
            shareReplay(1)
        );

        this._notes = data.notes;
        this.notes.reset(this._notes);

        this._showCancelModal
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(() => this.cancelModal().afterClosed()),
                tap(response => (response ? this._close(this._notes) : undefined))
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    private _close(notes: string): void {
        this._dialogRef.close({
            changed: this.notes.touched && notes !== this._notes,
            notes
        });
    }

    public cancel(): void {
        this._showCancelModal.next();
    }

    public assent(): void {
        this._close(this.notes.value);
    }

    private cancelModal(): MatDialogRef<ConfirmModalComponent> {
        const dialogRef: MatDialogRef<ConfirmModalComponent> = this._dialog.open(
            ConfirmModalComponent,
            {
                autoFocus: true,
                maxHeight: '90vh',
                data: {
                    title: 'Discard changes?',
                    bodyHtml: undefined,
                    confirm: 'Yes'
                }
            }
        );
        return dialogRef;
    }
}
