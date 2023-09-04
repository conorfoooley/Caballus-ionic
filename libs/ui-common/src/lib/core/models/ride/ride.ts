import { RideWithoutIds } from '@caballus/common';
import { UserIdentity } from '../user/user-identity';
import { RideGaitMetrics } from './ride-gait-metrics';
import { AppRideStatus } from '../../enums';
import { HorseIdentityWithGaits } from '../horse/horse-identity-with-gaits';
import { immerable } from 'immer';

export class Ride extends RideWithoutIds {
    public static [immerable] = true;

    public _id: string = '';
    public horseIdentities: HorseIdentityWithGaits[] = [];
    public riderIdentity: UserIdentity;
    public calculatedGaitMinutes: RideGaitMetrics[] = [];
    public manualGaitMinutes: RideGaitMetrics[] = [];
    public calculatedGaitKilometers: RideGaitMetrics[] = [];
    public appRideStatus?: AppRideStatus;

    constructor(params?: Partial<Ride>) {
        super(params);
        if (params) {
            this._id = params._id || this._id;
            this.horseIdentities = Array.isArray(params.horseIdentities)
                ? params.horseIdentities.map(h => new HorseIdentityWithGaits(h))
                : this.horseIdentities;
            this.riderIdentity = params.riderIdentity
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
            this.appRideStatus = params.appRideStatus || this.appRideStatus;
        }
    }
}

export class CurrentRide extends Ride {
    public static [immerable] = true;

    public didShowGpsWarning?: boolean;
}
