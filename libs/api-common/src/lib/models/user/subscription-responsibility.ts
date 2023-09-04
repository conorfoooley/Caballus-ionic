import { SubscriptionResponsibilityWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class SubscriptionResponsibility extends SubscriptionResponsibilityWithoutIds {
    public _id: ObjectId;
    public subscriptionId: ObjectId;

    constructor(params?: Partial<SubscriptionResponsibility>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.subscriptionId = !!params.subscriptionId ? parseObjectId(params.subscriptionId) : this.subscriptionId;
        }
    }
}
