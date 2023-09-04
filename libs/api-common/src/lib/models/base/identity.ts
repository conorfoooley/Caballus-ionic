import { IdentityWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class Identity extends IdentityWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<Identity>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
