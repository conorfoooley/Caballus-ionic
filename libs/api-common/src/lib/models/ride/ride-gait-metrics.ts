import { RideGaitMetricsWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/njs-db/mongo';

export class RideGaitMetrics extends RideGaitMetricsWithoutIds {
    public horseId: ObjectId;

    constructor(params?: Partial<RideGaitMetrics>) {
        super(params);
        if (!!params) {
            this.horseId = !!params.horseId ? parseObjectId(params.horseId) : this.horseId;
        }
    }
}
