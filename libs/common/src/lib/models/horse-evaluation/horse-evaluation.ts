import { HorseEvaluationType } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';

export class HorseEvaluationWithoutIds extends BaseDoc {
    public _id: any;
    public horseIdentity: HorseIdentityWithoutIds;
    public evaluator: string;
    public location: string;
    public date: Date;
    public evaluationType: HorseEvaluationType | string;

    constructor(params?: Partial<HorseEvaluationWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.horseIdentity = !!params.horseIdentity ? new HorseIdentityWithoutIds(params.horseIdentity) : this.horseIdentity;
            this.evaluator = params.evaluator || this.evaluator;
            this.location = params.location || this.location;
            this.date = params.date || this.date;
            this.evaluationType = params.evaluationType || HorseEvaluationType.Conformation;
        }
    }
}
