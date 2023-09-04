import { UserHorseRelationshipWithoutIds } from '@caballus/common';
import { UserHorseRelationshipStatus } from '../../enums';
import { HorseIdentity } from '../horse/horse-identity';
import { UserIdentity } from '../user/user-identity';
import { UserProfile } from '../user/user-profile';
import { HorseUserRelationshipHistory } from './horse-user-relationship-history';

export class UserHorseRelationship extends UserHorseRelationshipWithoutIds {
    public userIdentity: UserIdentity;
    public horseIdentity: HorseIdentity;
    public horseRoleId: string;
    public latest: HorseUserRelationshipHistory;
    public history: HorseUserRelationshipHistory[] = [];

    /** User placeholder to store human details if there is no associated Caballus user */
    public placeholderUserProfile: UserProfile;

    constructor(params?: Partial<UserHorseRelationship>) {
        super(params);
        if (!!params) {
            this.userIdentity = !!params.userIdentity
                ? new UserIdentity(params.userIdentity)
                : this.userIdentity;
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentity(params.horseIdentity)
                : this.horseIdentity;
            this.horseRoleId = params.horseRoleId || this.horseRoleId;
            this.latest = !!params.latest
                ? new HorseUserRelationshipHistory(params.latest)
                : this.latest;
            this.history = Array.isArray(params.history)
                ? params.history.map(h => new HorseUserRelationshipHistory(h))
                : this.history;
            this.placeholderUserProfile = !!params.placeholderUserProfile
                ? new UserProfile(params.placeholderUserProfile)
                : this.placeholderUserProfile;
        }
    }
}
