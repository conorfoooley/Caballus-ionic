import { InvitationWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';
import { HorseIdentity } from '../horse/horse-identity';
import { InvitationRecipient } from './invitation-recipient';
import { HorseRoleIdentity } from '../role/horse-role-identity';

export class Invitation extends InvitationWithoutIds {
    public _id: string;
    public from: UserIdentity;
    public to: InvitationRecipient;
    public horseIdentity: HorseIdentity;
    public horseRoleIdentity: HorseRoleIdentity;

    constructor(params?: Partial<Invitation>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.from = !!params.from
                ? new UserIdentity(params.from)
                : this.from;
            this.to = !!params.to
                ? new InvitationRecipient(params.to)
                : this.to;
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentity(params.horseIdentity)
                : this.horseIdentity;
            this.horseRoleIdentity = !!params.horseRoleIdentity
                ? new HorseRoleIdentity(this.horseRoleIdentity)
                : this.horseRoleIdentity;
        }
    }
}
