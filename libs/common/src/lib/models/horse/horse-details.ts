import { UserIdentityWithoutIds } from '../user/user-identity';
import { HorseWithoutIds } from './horse';

export class HorseDetailsWithoutIds extends HorseWithoutIds {
    public lastRideDate: Date;
    public lastRiderIdentity: UserIdentityWithoutIds;

    constructor(params?: Partial<HorseDetailsWithoutIds>) {
        super(params);
        if (!!params) {
            this.lastRideDate = params.lastRideDate || this.lastRideDate;
            this.lastRiderIdentity = !!params.lastRiderIdentity ? new UserIdentityWithoutIds(params.lastRiderIdentity) : this.lastRiderIdentity;
        }
    }
}
