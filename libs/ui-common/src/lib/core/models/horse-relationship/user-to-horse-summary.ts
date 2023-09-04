import { UserToHorseSummaryWithoutIds } from '@caballus/common';
import { HorseIdentity } from '../horse/horse-identity';
import { HorseRole } from '../role/horse-role';

export class UserToHorseSummary extends UserToHorseSummaryWithoutIds {
    public horseIdentity: HorseIdentity;
    public horseRoleReference: HorseRole;

    constructor(params?: Partial<UserToHorseSummary>) {
        super(params);
        if (!!params) {
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentity(params.horseIdentity)
                : this.horseIdentity;
            this.horseRoleReference = !!params.horseRoleReference
                ? new HorseRole(params.horseRoleReference)
                : this.horseRoleReference;
        }
    }
}
