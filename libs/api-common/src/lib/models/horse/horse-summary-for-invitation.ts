import { UserIdentity } from '../user/user-identity';
import { HorseSummaryForInvitationWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class HorseSummaryForInvitation extends HorseSummaryForInvitationWithoutIds {
    public _id: ObjectId;
    public invitationFrom: UserIdentity;

    constructor(params?: Partial<HorseSummaryForInvitation>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.invitationFrom = !!params.invitationFrom
                ? new UserIdentity(params.invitationFrom)
                : this.invitationFrom;
        }
    }
}
