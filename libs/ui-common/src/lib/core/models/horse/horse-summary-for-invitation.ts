import { HorseSummaryForInvitationWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';

export class HorseSummaryForInvitation extends HorseSummaryForInvitationWithoutIds {
    public _id: string;
    public invitationFrom: UserIdentity;

    constructor(params?: Partial<HorseSummaryForInvitation>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.invitationFrom = !!params.invitationFrom
                ? new UserIdentity(params.invitationFrom)
                : this.invitationFrom;
        }
    }
}
