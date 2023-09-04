import { Gait } from '../../enums';
import { GaitNumbers } from '../../types';
import { BaseMediaDocument } from '../media/base-media-document';
import { RideSummary } from '../ride/ride-summary';

export class HorseForRideWithoutIds {
    public _id: any;
    public commonName: string = '';
    public profilePicture: BaseMediaDocument;
    public gaitsKilometersPerHour: GaitNumbers = Gait.gaitNumbersNulled();
    public rides: RideSummary[] = [];

    constructor(params?: Partial<HorseForRideWithoutIds>) {

        if (!!params) {
            this._id = params._id || this._id;
            this.commonName = params.commonName || this.commonName;
            this.profilePicture = !!params.profilePicture ? new BaseMediaDocument(params.profilePicture) : this.profilePicture;

            for (const g of Gait.members) {
                if (!!params.gaitsKilometersPerHour) {
                    this.gaitsKilometersPerHour[g] = !!params.gaitsKilometersPerHour
                        ? params.gaitsKilometersPerHour[g]
                        : null;
                }
            }

            this.rides = Array.isArray(params.rides)
                ? params.rides.map(r => new RideSummary(r))
                : this.rides;
        }
    }
}
