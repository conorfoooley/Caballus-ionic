import { Gait } from '../../enums';
import { GaitNumbers } from '../../types';
import { RideWithoutIds } from '../ride/ride';
import { MS_PER_MINUTE } from '../../constants';

export class HorseStatTotals {
    public _id: string;
    public totalDistanceKilometers: number = 0;
    public totalMinutes: number = 0;
    public averageMinutesPerRide: number = 0;
    public averageKilometersPerRide: number = 0;
    public totalRides: number = 0;
    public totalRiders: number = 0;
    public riderNames: string[] = [];
    public totalMinutesPerGait: GaitNumbers = Gait.gaitNumbersZeroed();
    public totalDistancePerGait: GaitNumbers = Gait.gaitNumbersZeroed();

    constructor(params?: Partial<HorseStatTotals>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.totalDistanceKilometers = params.totalDistanceKilometers || this.totalDistanceKilometers;
            this.totalMinutes = params.totalMinutes || this.totalMinutes;
            this.averageMinutesPerRide = params.averageMinutesPerRide || this.averageMinutesPerRide;
            this.averageKilometersPerRide = params.averageKilometersPerRide || this.averageKilometersPerRide;
            this.totalRides = params.totalRides || this.totalRides;
            this.totalRiders = params.totalRiders || this.totalRiders;
            this.riderNames = params.riderNames || this.riderNames;

            for (const g of Gait.members) {
                this.totalMinutesPerGait[g] = !!params.totalMinutesPerGait
                    ? params.totalMinutesPerGait[g]
                    : 0;
                this.totalDistancePerGait[g] = !!params.totalDistancePerGait
                    ? params.totalDistancePerGait[g]
                    : 0;
            }
        }
    }

    /*
        method is optional to satisfy typechecker on interface extension
        of this class in the horse cache
    */
    public addRide?(horseId: string, r: RideWithoutIds): HorseStatTotals {
        const updated = new HorseStatTotals({ ...this });
        updated.totalDistanceKilometers += r.distanceKilometers;
        updated.totalMinutes += r.totalMinutesForHorse(horseId);
        updated.totalRides += 1;
        updated.averageKilometersPerRide = updated.totalDistanceKilometers / updated.totalRides;
        updated.averageMinutesPerRide = updated.totalMinutes / updated.totalRides;
        const newRider = !this.riderNames.includes(r.riderIdentity.label);
        if (newRider) {
            updated.totalRiders += 1;
            updated.riderNames = [...updated.riderNames, r.riderIdentity.label];
        }
        for (const g in Gait) {
            const key = Gait[g];
            const minutes = r.gaitMinutesForHorse(horseId);
            const distance = r.gaitDistanceForHorse(horseId);
            updated.totalMinutesPerGait[key] += minutes[key];
            updated.totalDistancePerGait[key] += distance[key];
        }
        return updated;
    }
}
