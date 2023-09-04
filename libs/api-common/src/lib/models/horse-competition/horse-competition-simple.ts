import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { HorseCompetition } from './horse-competition';

export class HorseCompetitionSimple extends HorseCompetition {
    public _id: ObjectId;

    constructor(params?: Partial<HorseCompetitionSimple>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
