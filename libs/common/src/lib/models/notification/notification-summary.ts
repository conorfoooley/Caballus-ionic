export class NotificationSummary {
    public Notifications: number = 0;
    public Click: number = 0;
    public Connections: number = 0;
    public Groups: number = 0;
    public Wall: number = 0;

    constructor(params?: Partial<NotificationSummary>) {
        if (!!params) {
            this.Notifications = params.Notifications || this.Notifications;
            this.Click = params.Click || this.Click;
            this.Connections = params.Connections || this.Connections;
            this.Groups = params.Groups || this.Groups;
            this.Wall = params.Wall || this.Wall;
        }
    }
}
