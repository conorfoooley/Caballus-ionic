import { Notification, User } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
// import firebaseAdmin from 'firebase-admin';

@Injectable()
export class PushNotificationsService {
    public async pushUser(notification: Notification, user: User): Promise<boolean> {
        let pushed = false;
        /* if (
            user.notificationSettings.pushNotifications.on &&
            user.notificationSettings.registrationTokens.length > 0
        ) {
            try {
                await firebaseAdmin
                    .messaging()
                    .sendToDevice(user.notificationSettings.registrationTokens, {
                        notification: {
                            body: notification.message
                        }
                    });
                pushed = true;
            } catch (error) {
                console.log('pushUser error', error);
                // Do nothing but prevent error
            }
        } */
        return pushed;
    }
}
