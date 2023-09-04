import { HorseIdentityWithGaitsWithoutIds } from '@caballus/common';
import { HorseIdentity } from './horse-identity';

export class HorseIdentityWithGaits extends HorseIdentityWithGaitsWithoutIds {

    constructor(params?: Partial<HorseIdentityWithGaits>) {
        super(params);
    }
}
