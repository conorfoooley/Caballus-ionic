import { HorseDetailsWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { UserIdentity } from '../user/user-identity';

export class HorseDetails extends HorseDetailsWithoutIds {
    public _id: ObjectId;
    public lastRiderIdentity: UserIdentity;

    constructor(params?: Partial<HorseDetails>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.lastRiderIdentity = !!params.lastRiderIdentity ? new UserIdentity(params.lastRiderIdentity) : this.lastRiderIdentity;
        }
    }
}
