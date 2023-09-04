import { BaseDoc } from '../base/base-doc';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';
import { HorseHealthType } from '../../enums';

export class HorseHealthWithoutIds extends BaseDoc {
    public _id: any;
    public horseIdentity: HorseIdentityWithoutIds;
    public date: Date;
    public horseHealthType: HorseHealthType;
    public notes: string;

    constructor(params?: Partial<HorseHealthWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.horseIdentity = !!params.horseIdentity ? new HorseIdentityWithoutIds(params.horseIdentity) : this.horseIdentity;
            this.date = params.date || this.date;
            this.notes = params.notes || this.notes;
            this.horseHealthType = params.horseHealthType || this.horseHealthType;
        }
    }
}
