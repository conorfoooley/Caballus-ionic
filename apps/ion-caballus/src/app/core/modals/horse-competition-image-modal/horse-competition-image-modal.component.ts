import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BaseMediaDocument } from '@caballus/common';

@Component({
    selector: 'app-horse-competition-image-modal',
    templateUrl: './horse-competition-image-modal.component.html',
    styleUrls: ['./horse-competition-image-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseCompetitionImageModalComponent implements OnInit {
    @Input()
    public attachedImage!: BaseMediaDocument;
    constructor(
        private readonly _modalController: ModalController,
    ) {}

    public ngOnInit(): void {}


    public dismissModal(flag: boolean = false): void {
        this._modalController.dismiss(flag);
    }
}
