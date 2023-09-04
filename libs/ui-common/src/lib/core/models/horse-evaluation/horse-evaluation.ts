import { HorseEvaluationWithoutIds } from '@caballus/common';

export class HorseEvaluation extends HorseEvaluationWithoutIds {
    public _id: string;

    constructor(params?: Partial<HorseEvaluation>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
