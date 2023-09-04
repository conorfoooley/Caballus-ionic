import { Gait } from '../../enums';
import { GaitNumbers } from '../../types';
import { HorseIdentityWithoutIds } from './horse-identity';

export class HorseIdentityWithGaitsWithoutIds extends HorseIdentityWithoutIds {
    public gaitsKilometersPerHourSnapshot: GaitNumbers = Gait.gaitNumbersNulled();

    constructor(params?: Partial<HorseIdentityWithGaitsWithoutIds>) {
        super(params);
        for (const g of Gait.members) {
            this.gaitsKilometersPerHourSnapshot[g] = !!params.gaitsKilometersPerHourSnapshot
                ? params.gaitsKilometersPerHourSnapshot[g]
                : null;
        }
    }
}
