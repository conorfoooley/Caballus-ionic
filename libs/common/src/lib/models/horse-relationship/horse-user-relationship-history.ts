import { HorseRoleIdentityWithoutIds } from '../role/horse-role-identity';
import { UserHorseRelationshipAction } from '../../enums';
import { UserIdentityWithoutIds } from '../user/user-identity';

export class HorseUserRelationshipHistoryWithoutIds {
    public userIdentity: UserIdentityWithoutIds;
    public roleIdentity: HorseRoleIdentityWithoutIds;
    public date: Date;
    public action: UserHorseRelationshipAction;

    constructor(params?: Partial<HorseUserRelationshipHistoryWithoutIds>) {
        if (!!params) {
            this.userIdentity = !!params.userIdentity ? new UserIdentityWithoutIds(params.userIdentity) : this.userIdentity;
            this.roleIdentity = !!params.roleIdentity ? new HorseRoleIdentityWithoutIds(params.roleIdentity) : this.roleIdentity;
            this.date = params.date || this.date;
            this.action = params.action || this.action;
        }
    }
}
