import { Gait } from '../../enums';
import { GaitNumbers } from '../../types';

export class RideGaitMetricsWithoutIds {
    public horseId: any;
    public metrics: GaitNumbers = Gait.gaitNumbersNulled();

    constructor(params?: Partial<RideGaitMetricsWithoutIds>) {
        if (!!params) {
            this.horseId = params.horseId || this.horseId;

            for (const g of Gait.members) {
                this.metrics[g] = !!params.metrics
                    ? params.metrics[g]
                    : null;
            }
        }
    }

    public sum(): number {
        let s = 0;
        for (const g in Gait) {
            const key = Gait[g];
            if (typeof this.metrics[key] === 'number') {
                s += this.metrics[key];
            }
        }
        return s;
    }
}
