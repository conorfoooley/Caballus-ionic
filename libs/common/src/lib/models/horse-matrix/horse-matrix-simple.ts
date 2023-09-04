import { MediaWithoutIds } from '../media/media';
import { HorseMatrixWithoutIds } from './horse-matrix';
export class HorseMatrixSimpleWithoutIds extends HorseMatrixWithoutIds {
    public documents: MediaWithoutIds[];
    constructor(params?: Partial<HorseMatrixSimpleWithoutIds>) {
        super(params);
        if (!!params) {
            this.documents = Array.isArray(params.documents)
                ? params.documents.map(d => new MediaWithoutIds(d))
                : this.documents;
        }
    }
}
