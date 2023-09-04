import { HorseEvaluation } from './horse-evaluation';

export class HorseEvaluationSimple extends HorseEvaluation {
    public _id: string;
    public isLocked: boolean;
    constructor(params?: Partial<HorseEvaluationSimple>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
