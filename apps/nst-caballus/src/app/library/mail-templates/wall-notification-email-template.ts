import { Notification } from '@caballus/api-common';
import { environment } from '@nst-caballus/env';
import { EmailTemplate } from '@rfx/nst-mailer';

export class WallNotificationEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'wallNotification.html';
    public subject: string = 'Wall Notification';

    constructor(notification: Notification) {
        super();

        const url = `${environment.ionBaseUrl}/tabs/wall/post/${notification.connectedRootPostId ||
            notification.connectedPostId}/reaction/${notification.connectedPostId}`;
        this.addSubstitution('url', url);

        this.addSubstitution('message', notification.message);
    }
}
