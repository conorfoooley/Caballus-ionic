import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { HorseEvaluation } from './horse-evaluation';

export class HorseEvaluationSimple extends HorseEvaluation {
    public _id: ObjectId;

    constructor(params?: Partial<HorseEvaluationSimple>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }
}
