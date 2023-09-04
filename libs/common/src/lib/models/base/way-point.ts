import { GeoPoint } from './geo-point';
import { immerable } from 'immer';

export class WayPoint extends GeoPoint {
    public static [immerable] = true;

    public timestamp: Date;

    constructor(params?: Partial<WayPoint>) {
        super(params);
        if (params) {
            this.timestamp = new Date(params.timestamp) || this.timestamp;
        }
    }
}
