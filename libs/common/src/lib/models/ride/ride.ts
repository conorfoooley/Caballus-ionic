import { RideCategory, RideEntryType, RideStatus, Gait } from '../../enums';
import { GaitNumbers } from '../../types';
import { BaseDoc } from '../base/base-doc';
import { HorseIdentityWithGaitsWithoutIds } from '../horse/horse-identity-with-gaits';
import { BaseMediaDocument } from '../media/base-media-document';
import { UserIdentityWithoutIds } from '../user/user-identity';
import { RideGaitMetricsWithoutIds } from './ride-gait-metrics';
import { RidePath } from './ride-path';
import { immerable } from 'immer';

export class RideWithoutIds extends BaseDoc {
    public static [immerable] = true;

    public _id: any;
    public horseIdentities: HorseIdentityWithGaitsWithoutIds[] = [];
    public riderIdentity: UserIdentityWithoutIds;
    public startDateTime: Date;
    public endDateTime: Date;
    public distanceKilometers: number = 0;
    public rideStatus: RideStatus;
    public category: RideCategory;
    public entryType: RideEntryType;
    public notes: string = '';
    public ridePicture?: BaseMediaDocument;
    public paths: RidePath[] = [];
    public calculatedGaitMinutes: RideGaitMetricsWithoutIds[] = [];
    public manualGaitMinutes: RideGaitMetricsWithoutIds[] = [];
    public calculatedGaitKilometers: RideGaitMetricsWithoutIds[] = [];
    public name?: string;

    constructor(params?: Partial<RideWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.horseIdentities = Array.isArray(params.horseIdentities)
                ? params.horseIdentities.map(h => new HorseIdentityWithGaitsWithoutIds(h))
                : this.horseIdentities;
            this.riderIdentity = !!params.riderIdentity
                ? new UserIdentityWithoutIds(params.riderIdentity)
                : this.riderIdentity;
            this.startDateTime = params.startDateTime || this.startDateTime;
            this.endDateTime = params.endDateTime || this.endDateTime;
            this.distanceKilometers = params.distanceKilometers || this.distanceKilometers;
            this.rideStatus = params.rideStatus || this.rideStatus;
            this.category = params.category || this.category;
            this.entryType = params.entryType || this.entryType;
            this.notes = params.notes || this.notes;
            this.paths = Array.isArray(params.paths)
                ? params.paths.map(p => new RidePath(p))
                : this.paths;
            this.calculatedGaitMinutes = Array.isArray(params.calculatedGaitMinutes)
                ? params.calculatedGaitMinutes.map(p => new RideGaitMetricsWithoutIds(p))
                : this.calculatedGaitMinutes;
            this.manualGaitMinutes = Array.isArray(params.manualGaitMinutes)
                ? params.manualGaitMinutes.map(p => new RideGaitMetricsWithoutIds(p))
                : this.manualGaitMinutes;
            this.calculatedGaitKilometers = Array.isArray(params.calculatedGaitKilometers)
                ? params.calculatedGaitKilometers.map(p => new RideGaitMetricsWithoutIds(p))
                : this.calculatedGaitKilometers;
            this.ridePicture = !!params.ridePicture
                ? new BaseMediaDocument(params.ridePicture)
                : this.ridePicture;
            this.name = !!params.name ? params.name : this.name;
        }
    }

    public totalMinutesForHorse(horseId: string): number {
        const manual = this.manualGaitMinutes.find(m => m.horseId === horseId);
        if (manual) {
            return manual.sum();
        }
        const calculated = this.calculatedGaitMinutes.find(m => horseId === horseId);
        if (calculated) {
            return calculated.sum();
        }
        return 0;
    }

    public gaitMinutesForHorse(horseId: string): GaitNumbers {
        const manual = this.manualGaitMinutes.find(m => m.horseId === horseId);
        if (manual) {
            return manual.metrics;
        }
        const calculated = this.calculatedGaitMinutes.find(m => horseId === horseId);
        if (calculated) {
            return calculated.metrics;
        }
        return Gait.gaitNumbersZeroed();
    }

    public gaitDistanceForHorse(horseId: string): GaitNumbers {
        const distance = this.calculatedGaitKilometers.find(c => c.horseId === horseId);
        if (distance) {
            return distance.metrics;
        }
        return Gait.gaitNumbersZeroed();
    }
}
