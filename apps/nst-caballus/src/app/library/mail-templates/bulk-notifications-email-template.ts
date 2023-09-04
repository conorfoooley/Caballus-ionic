import { Notification, NotificationCategory, NotificationFrequency } from '@caballus/api-common';
import { environment } from '@nst-caballus/env';
import { EmailTemplate } from '@rfx/nst-mailer';
import { groupBy } from 'lodash';

export class BulkNotificationsEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'bulkNotifications.html';
    public subject: string = 'Clicked Notifications';

    constructor(notifications: Notification[], frequency: NotificationFrequency) {
        super();

        let html: string = '';
        const categories = groupBy(notifications, n => n.notificationCategory);

        for (const category in categories) {
            html += `<h4>Check what happened in ${NotificationCategory.toString(
                category as NotificationCategory
            )}</h4><br />`;
            categories[category].forEach(notification => {
                html += `<a href="${environment.ionBaseUrl}">${notification.message}</a><br />`;
            });
            html += `<br /><br />`;
        }

        this.addSubstitution('notifications', html);

        this.addSubstitution('timespan', NotificationFrequency.toString(frequency));
    }
}
