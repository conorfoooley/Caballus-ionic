import { UserHorseRelationshipStatus } from '../../enums';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';
import { HorseRoleWithoutIds } from '../role/horse-role';

export class UserToHorseSummaryWithoutIds {
    public horseIdentity: HorseIdentityWithoutIds;
    public relationshipStatus: UserHorseRelationshipStatus;
    public horseRoleReference: HorseRoleWithoutIds;

    constructor(params?: Partial<UserToHorseSummaryWithoutIds>) {
        if (!!params) {
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentityWithoutIds(params.horseIdentity)
                : this.horseIdentity;
            this.horseRoleReference = !!params.horseRoleReference
                ? new HorseRoleWithoutIds(params.horseRoleReference)
                : this.horseRoleReference;
            this.relationshipStatus = params.relationshipStatus || this.relationshipStatus;
        }
    }
}
