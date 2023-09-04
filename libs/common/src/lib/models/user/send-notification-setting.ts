export class SendNotificationSetting {
    public appPushNotification: boolean = false;
    public emailNotification: boolean = false;

    constructor(params?: Partial<SendNotificationSetting>) {
        this.appPushNotification = params?.appPushNotification || this.appPushNotification;
        this.emailNotification = params?.emailNotification || this.emailNotification;
    }
}
