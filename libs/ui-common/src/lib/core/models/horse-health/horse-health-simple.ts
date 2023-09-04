import { HorseHealthSimpleWithoutIds } from '@caballus/common';

export class HorseHealthSimple extends HorseHealthSimpleWithoutIds {
    public _id: string;

    constructor(params?: Partial<HorseHealthSimple>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
