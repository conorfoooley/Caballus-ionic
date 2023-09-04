import { HorseIdentityWithoutIds } from '../horse/horse-identity';
import { HorseToUserSummaryWithoutIds } from './horse-to-user-summary';

export class HorseToUserCacheWithoutIds {
    public horseIdentity: HorseIdentityWithoutIds;
    public summaries: HorseToUserSummaryWithoutIds[] = [];

    constructor(params?: Partial<HorseToUserCacheWithoutIds>) {
        if (!!params) {
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentityWithoutIds(params.horseIdentity)
                : this.horseIdentity;
            this.summaries = Array.isArray(this.summaries)
                ? params.summaries.map(s => new HorseToUserSummaryWithoutIds(s))
                : this.summaries;
        }
    }
}
