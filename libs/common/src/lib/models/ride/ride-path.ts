import { WayPoint } from '../base/way-point';
import { immerable } from 'immer';

export class RidePath {
    public static [immerable] = true;

    public startDateTime: Date;
    public endDateTime: Date;
    public wayPoints: WayPoint[] = [];

    constructor(params?: Partial<RidePath>) {
        if (!!params) {
            // Need to parse the date only if it's a valid date
            this.startDateTime = Date.parse(params.startDateTime as any)
                && new Date(params.startDateTime)
                || this.startDateTime;
            this.endDateTime = Date.parse(params.endDateTime as any)
                && new Date(params.endDateTime)
                || this.endDateTime;
            this.wayPoints = Array.isArray(params.wayPoints)
                ? params.wayPoints.map(p => new WayPoint(p))
                : this.wayPoints;
        }
    }
}
