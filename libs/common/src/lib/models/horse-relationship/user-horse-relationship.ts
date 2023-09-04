import { UserHorseRelationshipStatus } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';
import { UserIdentityWithoutIds } from '../user/user-identity';
import { UserProfileWithoutIds } from '../user/user-profile';
import { HorseUserRelationshipHistoryWithoutIds } from './horse-user-relationship-history';

export class UserHorseRelationshipWithoutIds extends BaseDoc {
    public _id: any;
    public userIdentity: UserIdentityWithoutIds;
    public horseIdentity: HorseIdentityWithoutIds;
    public horseRoleId: any;
    public relationshipStatus: UserHorseRelationshipStatus;
    public latest: HorseUserRelationshipHistoryWithoutIds;
    public history: HorseUserRelationshipHistoryWithoutIds[] = [];

    /** User placeholder to store human details if there is no associated Caballus user */
    public placeholderUserProfile: UserProfileWithoutIds;

    constructor(params?: Partial<UserHorseRelationshipWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.userIdentity = !!params.userIdentity
                ? new UserIdentityWithoutIds(params.userIdentity)
                : this.userIdentity;
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentityWithoutIds(params.horseIdentity)
                : this.horseIdentity;
            this.horseRoleId = params.horseRoleId || this.horseRoleId;
            this.relationshipStatus = params.relationshipStatus || this.relationshipStatus;
            this.latest = !!params.latest
                ? new HorseUserRelationshipHistoryWithoutIds(params.latest)
                : this.latest;
            this.history = Array.isArray(params.history)
                ? params.history.map(h => new HorseUserRelationshipHistoryWithoutIds(h))
                : this.history;
            this.placeholderUserProfile = !!params.placeholderUserProfile
                ? new UserProfileWithoutIds(params.placeholderUserProfile)
                : this.placeholderUserProfile;
        }
    }
}
