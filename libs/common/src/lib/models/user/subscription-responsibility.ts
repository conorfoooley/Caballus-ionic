export class SubscriptionResponsibilityWithoutIds {
    public _id: any;
    public label: string = '';
    public horseCount: number = 0;
    public subscriptionId: any;
    public since: Date;

    constructor(params?: Partial<SubscriptionResponsibilityWithoutIds>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.label = params.label || this.label;
            this.horseCount = params.horseCount || this.horseCount;
            this.subscriptionId = params.subscriptionId || this.subscriptionId;
            this.since = !!params.since ? new Date(params.since) : this.since;
        }
    }
}
