import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface IDialogData {
    title: string;
    bodyHtml: string;
    confirm: string;
    component?: string;
    cancelText?: string;
}

@Component({
    selector: 'caballus-confirm-modal',
    templateUrl: './confirm-modal.component.html',
    styleUrls: ['./confirm-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent {
    public title = '';
    public bodyHtml = '';
    public confirm = '';
    public cancelText?: string = 'Cancel';
    public component?: string = '';
    constructor(
        public dialogRef: MatDialogRef<ConfirmModalComponent>,
        @Inject(MAT_DIALOG_DATA) data: IDialogData
    ) {
        this.title = data.title || this.title;
        this.bodyHtml = data.bodyHtml || this.bodyHtml;
        this.confirm = data.confirm || this.confirm;
        this.cancelText = data.cancelText !== undefined ? data.cancelText : this.cancelText;
        this.component = data.component || this.component
    }

    private _close(confirmed: boolean): void {
        this.dialogRef.close(confirmed);
    }

    public cancel(): void {
        this._close(false);
    }

    public assent(): void {
        this._close(true);
    }
}
