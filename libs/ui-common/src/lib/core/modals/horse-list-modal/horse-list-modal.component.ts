import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HorseDetails } from '@caballus/ui-common';

interface IDialogData {
    horses: HorseDetails[];
}

@Component({
    selector: 'horse-list-modal-modal',
    templateUrl: './horse-list-modal.component.html',
    styleUrls: ['./horse-list-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseListModalComponent implements OnInit {
    public horses: HorseDetails[];
    public selectedHorseIds: string[];

    constructor(public dialogRef: MatDialogRef<HorseListModalComponent>,  @Inject(MAT_DIALOG_DATA) data: IDialogData) {
        this.horses = data.horses
    }

    ngOnInit(): void {
    }

    private _close(confirmed: any): void {
        this.dialogRef.close(confirmed);
    }

    public cancel(): void {
        this._close({
            status: false,
            data: []
        });
    }

    public select(): void {
        this._close({
            status: true,
            data: this.selectedHorseIds
        });
    }

    public onChangeHorses(value: string[]): void {
        this.selectedHorseIds = value;
    }
}
