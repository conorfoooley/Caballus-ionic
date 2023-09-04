import { UserToHorseCacheWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';
import { UserToHorseSummary } from './user-to-horse-summary';

export class UserToHorseCache extends UserToHorseCacheWithoutIds {
    public userIdentity: UserIdentity;
    public summaries: UserToHorseSummary[] = [];

    constructor(params?: Partial<UserToHorseCache>) {
        super(params);
        if (!!params) {
            this.userIdentity = !!params.userIdentity
                ? new UserIdentity(params.userIdentity)
                : this.userIdentity;
            this.summaries = Array.isArray(this.summaries)
                ? params.summaries.map(s => new UserToHorseSummary(s))
                : this.summaries;
        }
    }
}
