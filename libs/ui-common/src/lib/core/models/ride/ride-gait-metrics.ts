import { RideGaitMetricsWithoutIds } from '@caballus/common';

export class RideGaitMetrics extends RideGaitMetricsWithoutIds {
    public horseId: string = '';

    constructor(params?: Partial<RideGaitMetrics>) {
        super(params);
        if (!!params) {
            this.horseId = params.horseId || this.horseId;
        }
    }
}
