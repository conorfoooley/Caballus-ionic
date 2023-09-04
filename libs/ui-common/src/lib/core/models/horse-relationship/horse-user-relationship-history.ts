import { HorseUserRelationshipHistoryWithoutIds } from '@caballus/common';
import { UserHorseRelationshipAction } from '../../enums';
import { UserIdentity } from '../user/user-identity';

export class HorseUserRelationshipHistory extends HorseUserRelationshipHistoryWithoutIds {
    public userIdentity: UserIdentity;

    constructor(params?: Partial<HorseUserRelationshipHistory>) {
        super(params);
        if (!!params) {
            this.userIdentity = !!params.userIdentity ? new UserIdentity(params.userIdentity) : this.userIdentity;
        }
    }
}
