import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface IDialogData {
    title: string;
    isWeb: boolean;
}

export enum MediaSelectionSource {
    PICK_PHOTO,
    TAKE_PHOTO,
    PICK_VIDEO,
    TAKE_VIDEO
}

@Component({
    selector: 'caballus-media-modal',
    templateUrl: './media-modal.component.html',
    styleUrls: ['./media-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaModalComponent {
    public title: string = '';
    public isWeb: boolean = false;

    constructor(
        private _dialogRef: MatDialogRef<MediaModalComponent>,
        @Inject(MAT_DIALOG_DATA) data: IDialogData
    ) {
        this.title = data.title || this.title;
        this.isWeb = data.isWeb || this.isWeb;
    }

    private _close(mediaSource: MediaSelectionSource): void {
        this._dialogRef.close(mediaSource);
    }

    public uploadPhoto(): void {
        this._close(MediaSelectionSource.PICK_PHOTO);
    }

    public takePhoto(): void {
        this._close(MediaSelectionSource.TAKE_PHOTO);
    }

    public uploadVideo(): void {
        this._close(MediaSelectionSource.PICK_VIDEO);
    }

    public takeVideo(): void {
        this._close(MediaSelectionSource.TAKE_VIDEO);
    }
}
