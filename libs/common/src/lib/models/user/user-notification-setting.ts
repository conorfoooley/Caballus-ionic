import { AllowNotificationSetting } from "./allow-notification-setting";
import { SendNotificationSetting } from "./send-notification-setting";

export class UserNotificationSetting {
    public allowNotificationSetting: AllowNotificationSetting;
    public sendNotificationSetting: SendNotificationSetting;

    constructor(params?: Partial<UserNotificationSetting>) {
        if (!!params) {
            this.allowNotificationSetting = params.allowNotificationSetting ? new AllowNotificationSetting(params.allowNotificationSetting || {})
            : this.allowNotificationSetting;
            this.sendNotificationSetting = params.sendNotificationSetting ? new SendNotificationSetting(params.sendNotificationSetting || {})
            : this.sendNotificationSetting;
        }
    }
}
