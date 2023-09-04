import { HorseHealthWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class HorseHealth extends HorseHealthWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<HorseHealth>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
