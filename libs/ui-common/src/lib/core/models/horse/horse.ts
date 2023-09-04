import { HorseWithoutIds } from '@caballus/common';
import { HorseIdentity } from './horse-identity';
import { Ride } from '../ride/ride';

export class Horse extends HorseWithoutIds {
    public _id: string;
    // for storage on unsynced horses to create
    public finalizedRides: Ride[] = [];

    constructor(params?: Partial<Horse>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.finalizedRides = Array.isArray(params.finalizedRides)
                ? params.finalizedRides.map(r => new Ride(r))
                : this.finalizedRides;
        }
    }

    public toIdentity(): HorseIdentity {
        return new HorseIdentity({
            _id: this._id,
            label: this.profile.commonName,
            picture: this.profile.profilePicture
        });
    }
}
