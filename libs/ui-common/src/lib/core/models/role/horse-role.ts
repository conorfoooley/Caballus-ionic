import { HorseRoleWithoutIds } from '@caballus/common';
import { HorseRoleIdentity } from '../role/horse-role-identity';

export class HorseRole extends HorseRoleWithoutIds {
    public _id: string = '';

    constructor(params?: Partial<HorseRole>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }

    public toIdentity(): HorseRoleIdentity {
        return new HorseRoleIdentity({
            _id: this._id,
            label: this.name
        });
    }
}
