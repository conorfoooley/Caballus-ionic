import { HorseIdentityWithoutIds } from '../horse/horse-identity';
import { HorseHealthType } from '../../enums';
import { MediaWithoutIds } from '../media/media';
export class HorseHealthSimpleWithoutIds {
    public _id: any;
    public horseIdentity: HorseIdentityWithoutIds;
    public date: Date;
    public horseHealthType: HorseHealthType;
    public notes: string;
    public documents: MediaWithoutIds[];

    constructor(params?: Partial<HorseHealthSimpleWithoutIds>) {

        if (!!params) {
            this._id = params._id || this._id;
            this.date = params.date || this.date;
            this.notes = params.notes || this.notes;
            this.horseIdentity = !!params.horseIdentity ? new HorseIdentityWithoutIds(params.horseIdentity) : this.horseIdentity;
            this.documents = Array.isArray(params.documents)
                ? params.documents.map(d => new MediaWithoutIds(d))
                : this.documents;
        }
    }
}
