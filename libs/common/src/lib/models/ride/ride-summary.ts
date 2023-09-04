import { RideCategory } from '../../enums';
import { BaseMediaDocument } from '../media/base-media-document';

export class RideSummary {
    public category: RideCategory;
    public riderName: string = '';
    public distanceKilometers: number = 0;
    public notes: string = '';
    public ridePicture?: BaseMediaDocument;

    constructor(params?: Partial<RideSummary>) {
        if (!!params) {
            this.category = params.category || this.category;
            this.riderName = params.riderName || this.riderName;
            this.distanceKilometers = params.distanceKilometers || this.distanceKilometers;
            this.notes = params.notes || this.notes;
            this.ridePicture = params.ridePicture || this.ridePicture;
        }
    }
}
