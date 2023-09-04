import { BaseDoc } from '../base/base-doc';
import { UserIdentityWithoutIds } from '../user/user-identity';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';
import { InvitationRecipientWithoutIds } from './invitation-recipient';
import { InvitationStatus, InvitationType } from '../../enums';
import { HorseRoleIdentityWithoutIds } from '../role/horse-role-identity';

export class InvitationWithoutIds extends BaseDoc {
    public _id: any;
    public from: UserIdentityWithoutIds;
    public to: InvitationRecipientWithoutIds;
    public horseIdentity: HorseIdentityWithoutIds;
    public horseRoleIdentity: HorseRoleIdentityWithoutIds;
    public invitationStatus: InvitationStatus;
    public invitationType: InvitationType;

    constructor(params?: Partial<InvitationWithoutIds>) {
        super(params);
        if (!!params) {
            this.from = !!params.from
                ? new UserIdentityWithoutIds(params.from)
                : this.from;
            this.to = !!params.to
                ? new InvitationRecipientWithoutIds(params.to)
                : this.to;
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentityWithoutIds(params.horseIdentity)
                : this.horseIdentity;
            this.horseRoleIdentity = !!params.horseRoleIdentity
                ? new HorseRoleIdentityWithoutIds(this.horseRoleIdentity)
                : this.horseRoleIdentity;
            this.invitationStatus = params.invitationStatus || this.invitationStatus;
            this.invitationType = params.invitationType || this.invitationType;
        }
    }
}
