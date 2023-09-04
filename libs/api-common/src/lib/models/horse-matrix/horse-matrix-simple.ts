import { HorseMatrixSimpleWithoutIds } from '@caballus/common';
import { ObjectId } from '@rfx/nst-db/mongo';
import { Media } from '../media/media';

export class HorseMatrixSimple extends HorseMatrixSimpleWithoutIds {
    public _id: ObjectId;

    constructor(params?: Partial<HorseMatrixSimple>) {
        super(params);
        if (!!params) {
            this.documents = Array.isArray(params.documents)
                ? params.documents.map(d => new Media(d))
                : this.documents;
        }
    }
}
