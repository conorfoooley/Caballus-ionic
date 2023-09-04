import { HorseCompetitionWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { HorseIdentity } from '../horse/horse-identity';

export class HorseCompetition extends HorseCompetitionWithoutIds {
    public _id: ObjectId;
    public horseIdentity: HorseIdentity;

    constructor(params?: Partial<HorseCompetition>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
