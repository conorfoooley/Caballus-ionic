import { HorseRoleWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { HorseRoleIdentity } from './horse-role-identity';

export class HorseRole extends HorseRoleWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<HorseRole>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }

    public toIdentity(): HorseRoleIdentity {
        return new HorseRoleIdentity({
            _id: this._id,
            label: this.name
        });
    }
}
