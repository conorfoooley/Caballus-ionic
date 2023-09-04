import { HorseMatrixWithoutIds } from '@caballus/common';

export class HorseMatrix extends HorseMatrixWithoutIds {
    public _id: string;

    constructor(params?: Partial<HorseMatrix>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
