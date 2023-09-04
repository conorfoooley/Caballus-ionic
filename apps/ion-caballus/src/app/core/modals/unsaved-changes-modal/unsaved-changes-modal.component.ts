import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-unsaved-changes-modal',
    templateUrl: './unsaved-changes-modal.component.html',
    styleUrls: ['./unsaved-changes-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsavedChangeModalComponent implements OnInit {

    constructor(private readonly _modalController: ModalController) { }

    public ngOnInit(): void { }

    public no(): void {
        this._modalController.dismiss(false);
    }

    public yes(): void {
        this._modalController.dismiss(true);
    }

}
