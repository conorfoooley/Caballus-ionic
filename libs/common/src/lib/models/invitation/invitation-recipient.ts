import { UserIdentityWithoutIds } from '../user/user-identity';

export class InvitationRecipientWithoutIds {
    public email: string;
    public userIdentity: UserIdentityWithoutIds;

    constructor(params?: Partial<InvitationRecipientWithoutIds>) {
        if (!!params) {
            this.email = params.email || this.email;
            this.userIdentity = !!params.userIdentity
                ? new UserIdentityWithoutIds(params.userIdentity)
                : this.userIdentity;
        }
    }
}
