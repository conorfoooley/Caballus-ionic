import { RideWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/njs-db/mongo';
import { HorseIdentity } from '../horse/horse-identity';
import { HorseIdentityWithGaits } from '../horse/horse-identity-with-gaits';
import { UserIdentity } from '../user/user-identity';
import { RideGaitMetrics } from './ride-gait-metrics';

export class Ride extends RideWithoutIds {
    public _id: ObjectId;
    public horseIdentities: HorseIdentityWithGaits[] = [];
    public riderIdentity: UserIdentity;
    public calculatedGaitMinutes: RideGaitMetrics[] = [];
    public manualGaitMinutes: RideGaitMetrics[] = [];
    public calculatedGaitKilometers: RideGaitMetrics[] = [];

    constructor(params?: Partial<Ride>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.horseIdentities = Array.isArray(params.horseIdentities)
                ? params.horseIdentities.map(h => new HorseIdentityWithGaits(h))
                : this.horseIdentities;
            this.riderIdentity = !!params.riderIdentity
                ? new UserIdentity(params.riderIdentity)
                : this.riderIdentity;
            this.calculatedGaitMinutes = Array.isArray(params.calculatedGaitMinutes)
                ? params.calculatedGaitMinutes.map(p => new RideGaitMetrics(p))
                : this.calculatedGaitMinutes;
            this.manualGaitMinutes = Array.isArray(params.manualGaitMinutes)
                ? params.manualGaitMinutes.map(p => new RideGaitMetrics(p))
                : this.manualGaitMinutes;
            this.calculatedGaitKilometers = Array.isArray(params.calculatedGaitKilometers)
                ? params.calculatedGaitKilometers.map(p => new RideGaitMetrics(p))
                : this.calculatedGaitKilometers;
        }
    }
}
