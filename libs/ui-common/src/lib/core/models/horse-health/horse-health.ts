import { HorseHealthWithoutIds } from '@caballus/common';

export class HorseHealth extends HorseHealthWithoutIds {
    public _id: string;

    constructor(params?: Partial<HorseHealth>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
