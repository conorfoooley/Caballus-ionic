import { UserIdentityWithoutIds } from '../user/user-identity';
import { UserToHorseSummaryWithoutIds } from './user-to-horse-summary';

export class UserToHorseCacheWithoutIds {
    public userIdentity: UserIdentityWithoutIds;
    public summaries: UserToHorseSummaryWithoutIds[] = [];

    constructor(params?: Partial<UserToHorseCacheWithoutIds>) {
        if (!!params) {
            this.userIdentity = !!params.userIdentity
                ? new UserIdentityWithoutIds(params.userIdentity)
                : this.userIdentity;
            this.summaries = Array.isArray(this.summaries)
                ? params.summaries.map(s => new UserToHorseSummaryWithoutIds(s))
                : this.summaries;
        }
    }
}
