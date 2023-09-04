import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { Notification } from "@caballus/ui-common";
import { ModalController } from "@ionic/angular";

@Component({
    selector: 'app-notification-modal',
    templateUrl: './notification-modal.component.html',
    styleUrls: ['./notification-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationModalComponent implements OnInit {

    @Input()
    public notification:Notification;
    constructor(
        private readonly _modalController: ModalController
    ) {}

    public ngOnInit(): void {
    }

    public dismiss(): void {
        this._modalController.dismiss({markAsRead:true});
    }
}
