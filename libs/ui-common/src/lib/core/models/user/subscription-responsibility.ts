import { SubscriptionResponsibilityWithoutIds } from '@caballus/common';

export class SubscriptionResponsibility extends SubscriptionResponsibilityWithoutIds {
    public _id: string;
    public subscriptionId: string;

    constructor(params?: Partial<SubscriptionResponsibility>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.subscriptionId = params.subscriptionId || this.subscriptionId;
        }
    }
}
