import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-prompt-msg-modal',
    templateUrl: './prompt-msg-modal.component.html',
    styleUrls: ['./prompt-msg-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromptMsgModalComponent implements OnInit {
    public promptForm: FormGroup = this._formBuilder.group({
        message: ['']
    });
    constructor(private readonly _modalController: ModalController, private readonly _formBuilder: FormBuilder) { }

    public ngOnInit(): void { }

    public onSave(): void {
        this._modalController.dismiss(this.promptForm.value.message);
    }

}
