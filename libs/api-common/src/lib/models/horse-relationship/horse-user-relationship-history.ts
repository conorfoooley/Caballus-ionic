import { HorseRoleIdentity } from '../role/horse-role-identity';
import { HorseUserRelationshipHistoryWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';

export class HorseUserRelationshipHistory extends HorseUserRelationshipHistoryWithoutIds {
    public userIdentity: UserIdentity;
    public roleIdentity: HorseRoleIdentity;

    constructor(params?: Partial<HorseUserRelationshipHistory>) {
        super(params);
        if (!!params) {
            this.userIdentity = !!params.userIdentity ? new UserIdentity(params.userIdentity) : this.userIdentity;
            this.roleIdentity = !!params.roleIdentity ? new HorseRoleIdentity(params.roleIdentity) : this.roleIdentity;
        }
    }
}
