
import { HorseToUserCacheWithoutIds } from '@caballus/common';
import { HorseIdentity } from '../horse/horse-identity';
import { HorseToUserSummary } from './horse-to-user-summary';

export class HorseToUserCache extends HorseToUserCacheWithoutIds {
    public horseIdentity: HorseIdentity;
    public summaries: HorseToUserSummary[] = [];

    constructor(params?: Partial<HorseToUserCache>) {
        super(params);
        if (!!params) {
            this.horseIdentity = !!params.horseIdentity
                ? new HorseIdentity(params.horseIdentity)
                : this.horseIdentity;
            this.summaries = Array.isArray(this.summaries)
                ? params.summaries.map(s => new HorseToUserSummary(s))
                : this.summaries;
        }
    }
}
