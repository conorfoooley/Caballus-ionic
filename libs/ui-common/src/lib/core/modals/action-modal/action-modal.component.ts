import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface IDialogData {
    title: string;
    description: string;
    buttonOneLabel: string;
    buttonTwoLabel: string;
    buttonThreeLabel: string;
    buttonFourLabel: string;
}

@Component({
    selector: 'caballus-action-modal',
    templateUrl: './action-modal.component.html',
    styleUrls: ['./action-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonModal  {
    public title = '';
    public description = '';
    public buttonOneLabel = '';
    public buttonTwoLabel = '';
    public buttonThreeLabel = '';
    public buttonFourLabel = '';


    constructor(
        public dialogRef: MatDialogRef<ActionButtonModal>,
        @Inject(MAT_DIALOG_DATA) data: IDialogData
    ) {
        this.title = data.title || this.title;
        this.description = data.description || this.description;
        this.buttonOneLabel = data.buttonOneLabel || this.buttonOneLabel;
        this.buttonTwoLabel = data.buttonTwoLabel || this.buttonTwoLabel;
        this.buttonThreeLabel = data.buttonThreeLabel || this.buttonThreeLabel;
        this.buttonFourLabel = data.buttonFourLabel || this.buttonFourLabel;
    }

    private _close(confirmed: boolean | string): void {
        this.dialogRef.close(confirmed);
    }

    public cancel(): void {
        this._close(false);
    }

    public assent(button: string): void {
        this._close(button);
    }
}
