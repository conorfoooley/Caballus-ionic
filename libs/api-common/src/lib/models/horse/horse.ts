import { HorseWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/nst-db/mongo';
import { HorseIdentity } from './horse-identity';

export class Horse extends HorseWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<Horse>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
        }
    }

    public toIdentity(): HorseIdentity {
        return new HorseIdentity({
            _id: this._id,
            label: this.profile.commonName,
            picture: this.profile.profilePicture
        });
    }
}
