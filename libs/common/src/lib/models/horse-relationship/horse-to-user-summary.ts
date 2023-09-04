import { UserHorseRelationshipStatus } from '../../enums';
import { HorseRoleWithoutIds } from '../role/horse-role';
import { UserIdentityWithoutIds } from '../user/user-identity';

export class HorseToUserSummaryWithoutIds {
    public userIdentity: UserIdentityWithoutIds;
    public relationshipStatus: UserHorseRelationshipStatus;
    public horseRoleReference: HorseRoleWithoutIds;

    constructor(params?: Partial<HorseToUserSummaryWithoutIds>) {
        if (!!params) {
            this.userIdentity = !!params.userIdentity
                ? new UserIdentityWithoutIds(params.userIdentity)
                : this.userIdentity;
            this.horseRoleReference = !!params.horseRoleReference
                ? new HorseRoleWithoutIds(params.horseRoleReference)
                : this.horseRoleReference;
            this.relationshipStatus = params.relationshipStatus || this.relationshipStatus;
        }
    }
}
