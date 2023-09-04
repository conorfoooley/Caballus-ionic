import { HorseMatrixSimpleWithoutIds } from '@caballus/common';
import { Media } from '../media/media';
export class HorseMatrixSimple extends HorseMatrixSimpleWithoutIds {
    public _id: string;
    public newDocuments: File[];
    public documents: Media[];
    constructor(params?: Partial<HorseMatrixSimple>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.newDocuments = params.newDocuments || this.newDocuments;
            this.documents = Array.isArray(params.documents)
            ? params.documents.map(d => new Media(d))
            : this.documents;
        }
    }
}
