import { HorseCompetitionWithoutIds } from '@caballus/common';

export class HorseCompetition extends HorseCompetitionWithoutIds {
    public _id: string;

    constructor(params?: Partial<HorseCompetition>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
