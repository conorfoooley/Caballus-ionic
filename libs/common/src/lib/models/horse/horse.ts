import { Gait } from '../../enums';
import { GaitNumbers } from '../../types';
import { BaseDoc } from '../base/base-doc';
import { HorseIdentityWithoutIds } from './horse-identity';
import { HorseProfile } from './horse-profile';
import { HorseVeterinarianProfile } from './horse-veterinarian-profile';

export class HorseWithoutIds extends BaseDoc {
    public _id: any;
    public profile: HorseProfile = new HorseProfile();
    public gaitsKilometersPerHour: GaitNumbers = Gait.gaitNumbersNulled();
    public veterinarianProfile: HorseVeterinarianProfile = new HorseVeterinarianProfile();

    constructor(params?: Partial<HorseWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.profile = !!params.profile ? new HorseProfile(params.profile) : this.profile;
            this.veterinarianProfile = !!params.veterinarianProfile ? new HorseVeterinarianProfile(params.veterinarianProfile) : this.veterinarianProfile;

            for (const g of Gait.members) {
                this.gaitsKilometersPerHour[g] = !!params.gaitsKilometersPerHour
                    ? params.gaitsKilometersPerHour[g]
                    : null;
            }
        }
    }

    public toIdentity(): HorseIdentityWithoutIds {
        return new HorseIdentityWithoutIds({
            _id: this._id,
            label: this.profile.commonName,
            picture: this.profile.profilePicture
        });
    }
}
