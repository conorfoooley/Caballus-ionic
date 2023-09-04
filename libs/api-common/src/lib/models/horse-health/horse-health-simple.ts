import { HorseHealthSimpleWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';

export class HorseHealthSimple extends HorseHealthSimpleWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<HorseHealthSimple>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
