import { EVALUATION_LOCK_TIME_IN_HOUR, HorseEvaluationWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { HorseIdentity } from '../horse/horse-identity';
import moment from 'moment';

export class HorseEvaluation extends HorseEvaluationWithoutIds {
    public _id: ObjectId;
    public horseIdentity: HorseIdentity;
    public isLocked: boolean;

    constructor(params?: Partial<HorseEvaluation>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.isLocked = moment().diff(params.createdDate, 'hours') >= EVALUATION_LOCK_TIME_IN_HOUR;
        }
    }
}
