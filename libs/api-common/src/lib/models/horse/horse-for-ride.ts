import { HorseForRideWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class HorseForRide extends HorseForRideWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<HorseForRide>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }

}
