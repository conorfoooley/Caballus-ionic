import { HorseForRideWithoutIds, HorseProfileStatus } from '@caballus/common';

export class HorseForRide extends HorseForRideWithoutIds {
    public _id: string;
    // profile status included for offline filtering of disabled horses
    public profileStatus: HorseProfileStatus = HorseProfileStatus.Active;

    constructor(params?: Partial<HorseForRide>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.profileStatus = params.profileStatus || this.profileStatus;
        }
    }
}
