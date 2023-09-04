import { InvitationRecipientWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';

export class InvitationRecipient extends InvitationRecipientWithoutIds {
    public userIdentity: UserIdentity;

    constructor(params?: Partial<InvitationRecipient>) {
        super(params);
        if (!!params) {
            this.userIdentity = !!params.userIdentity
                ? new UserIdentity(params.userIdentity)
                : this.userIdentity;
        }
    }
}
