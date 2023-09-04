import { BaseDoc } from '../base/base-doc';
import { BaseMediaDocument } from '../media/base-media-document'
import { HorseIdentityWithoutIds } from '../horse/horse-identity';

export class HorseCompetitionWithoutIds extends BaseDoc {
    public _id: any;
    public horseIdentity: HorseIdentityWithoutIds;
    public name: string;
    public date: Date;
    public location: string;
    public results: string;
    public notes: string;
    public image: BaseMediaDocument


    constructor(params?: Partial<HorseCompetitionWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.horseIdentity = !!params.horseIdentity ? new HorseIdentityWithoutIds(params.horseIdentity) : this.horseIdentity;
            this.name = params.name || this.name;
            this.date = params.date || this.date;
            this.location = params.location || this.location;
            this.results = params.results || this.results;
            this.notes = params.notes || this.notes;
            this.image = params.image || this.image;
        }
    }
}
