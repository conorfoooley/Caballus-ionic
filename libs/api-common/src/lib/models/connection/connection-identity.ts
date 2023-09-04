import { ConnectionIdentityWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class ConnectionIdentity extends ConnectionIdentityWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<ConnectionIdentity>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
