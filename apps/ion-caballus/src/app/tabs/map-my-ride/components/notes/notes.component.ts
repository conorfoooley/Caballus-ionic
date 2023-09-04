import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ModalService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
    selector: 'app-notes',
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotesComponent implements OnInit, OnDestroy {
    @Input()
    public form: FormGroup;

    private _onDestroy$: Subject<void> = new Subject();
    private _showNotesModal$: Subject<void> = new Subject();

    public maxChars = 500;

    constructor(
        private readonly _modalService: ModalService,
        private readonly _toastService: ToastService
    ) {}

    public ngOnInit(): void {
        this._showNotesModal$
            .pipe(
                takeUntil(this._onDestroy$),
                switchMap(() =>
                    this._modalService.rideNotes(this.form.controls.notes.value).afterClosed()
                ),
                tap(modalResult =>
                    modalResult.changed
                        ? this.form.controls.notes.setValue(modalResult.notes)
                        : undefined
                ),
                tap(modalResult =>
                    modalResult.changed ? this._toastService.info('Note is saved') : undefined
                ),
                tap(c => console.log(c))
            )
            .subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public showNotesModal(): void {
        this._showNotesModal$.next();
    }

    public getTextLength(): number {
        const notes = this.form.controls.notes.value;
        if (notes) {
            return notes.length;
        } else {
            return 0;
        }
    }
}
