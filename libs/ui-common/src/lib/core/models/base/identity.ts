import { IdentityWithoutIds } from '@caballus/common';

export class Identity extends IdentityWithoutIds {
    public _id: string;

    constructor(params?: Partial<Identity>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
