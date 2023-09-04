import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-notification-banner',
    templateUrl: './notification-banner.component.html',
    styleUrls: ['./notification-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBannerComponent {
    public showNotification$: BehaviorSubject<boolean> = new BehaviorSubject(true);
    
    @Input() public message?: string = null;

    constructor() {}
}
