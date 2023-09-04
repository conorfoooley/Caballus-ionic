import { ConnectionWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/njs-db/mongo';
import { UserIdentity } from '../user/user-identity';
// import { ClickEvent } from './click-event';

export class Connection extends ConnectionWithoutIds {
    public _id: ObjectId;
    public userIdentities: UserIdentity[] = [];
    public seenBy: UserIdentity[] = [];

    constructor(params: Partial<Connection>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.userIdentities = Array.isArray(params.userIdentities)
                ? params.userIdentities.map(u => new UserIdentity(u))
                : this.userIdentities; 
            this.seenBy = Array.isArray(params.seenBy)
                ? params.seenBy.map(u => new UserIdentity(u))
                : this.seenBy;
        }
    }
}
