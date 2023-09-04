import { HorseToUserSummaryWithoutIds } from '@caballus/common';
import { HorseRole } from '../role/horse-role';
import { UserIdentity } from '../user/user-identity';

export class HorseToUserSummary extends HorseToUserSummaryWithoutIds {
    public userIdentity: UserIdentity;
    public horseRoleReference: HorseRole;

    constructor(params?: Partial<HorseToUserSummary>) {
        super(params);
        if (!!params) {
            this.userIdentity = !!params.userIdentity
                ? new UserIdentity(params.userIdentity)
                : this.userIdentity;
            this.horseRoleReference = !!params.horseRoleReference
                ? new HorseRole(params.horseRoleReference)
                : this.horseRoleReference;
        }
    }
}
