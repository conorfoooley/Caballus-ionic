import { MediaWithoutIds } from '../media/media';
import { RideWithoutIds } from './ride';
export class RideHistorySimple extends RideWithoutIds {
    public documents: MediaWithoutIds[];
    public medias?: MediaWithoutIds[];

    constructor(params?: Partial<RideHistorySimple>) {
        super(params);
        if (params) {
            this.documents = Array.isArray(params.documents)
                ? params.documents.map(d => new MediaWithoutIds(d))
                : this.documents;
            this.medias = Array.isArray(params.medias)
                ? params.medias.map(d => new MediaWithoutIds(d))
                : this.medias;
        }
    }
}
