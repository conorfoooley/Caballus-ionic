import { HorseCompetition } from './horse-competition';

export class HorseCompetitionSimple extends HorseCompetition {
    public _id: string;

    constructor(params?: Partial<HorseCompetitionSimple>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
