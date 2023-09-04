import { EARTH_RADIUS_KILOMETERS, MS_PER_SECOND, MS_PER_MINUTE, MS_PER_HOUR } from '../constants';
import { Gait } from '../enums';
import { RidePath, RideWithoutIds, WayPoint } from '../models';
import { GaitNumbers } from '../types';

export function degToRad(degrees: number): number {
    // tslint:disable-next-line:no-magic-numbers
    return degrees * (Math.PI / 180);
}

/*
    Calculate distance between two gps points using the Haversine formula
*/
export function wayPointKilometers(source: WayPoint, destination: WayPoint): number {
    const rlat1 = degToRad(source.latitude); // Convert degrees to radians
    const rlat2 = degToRad(destination.latitude); // Convert degrees to radians
    const difflat = rlat2 - rlat1; // Radian difference (latitudes)
    // tslint:disable-next-line:no-magic-numbers
    const difflon = (destination.longitude - source.longitude) * (Math.PI / 180); // Radian difference (longitudes)
    // tslint:disable-next-line:no-magic-numbers
    const distance =
        2 *
        EARTH_RADIUS_KILOMETERS *
        Math.asin(
            Math.sqrt(
                Math.sin(difflat / 2) *
                    // tslint:disable-next-line:no-magic-numbers
                    Math.sin(difflat / 2) +
                    Math.cos(rlat1) *
                        Math.cos(rlat2) *
                        Math.sin(difflon / 2) *
                        Math.sin(difflon / 2)
            )
        );
    return Math.abs(distance);
}

export function getKphGait(
    kmPerHour: number,
    horseGaitsKph: GaitNumbers,
    preventErrorOnGaitNotFound = false
): Gait {
    for (let _g = Gait.members.length - 1; _g >= 0; --_g) {
        const g = Gait.members[_g];
        const gaitLowerBound = horseGaitsKph[g];
        if (kmPerHour >= gaitLowerBound) {
            return g;
        }
    }
    if (!preventErrorOnGaitNotFound) {
        throw new Error(`Gait not found for kph ${kmPerHour}`);
    }
    return null;
}

export function wayPointPairStats(
    a: WayPoint,
    b: WayPoint,
    horseGaitsKph: GaitNumbers,
    isViewRide = true
): { kilometers: number; millisec: number; gait: Gait } {
    const millisec = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    const hours = millisec / MS_PER_HOUR;
    const kilometers = wayPointKilometers(a, b);
    const kmPerHour = kilometers / hours;
    const gait = getKphGait(kmPerHour, horseGaitsKph, isViewRide);
    return { kilometers, millisec, gait };
}

export function getRideKilometers(ride: RideWithoutIds): number {
    if (ride.distanceKilometers > 0) {
        return ride.distanceKilometers;
    }

    let kilometers = 0;
    for (const p of ride.paths) {
        for (let i = 0; i < p.wayPoints.length - 1; ++i) {
            kilometers += wayPointKilometers(p.wayPoints[i], p.wayPoints[i + 1]);
        }
    }
    return kilometers;
}

/*
    Sum distance per gait respecting gaps between paths for ride pauses
*/
export function getRideKilometersPerGait(
    ride: RideWithoutIds,
    horseGaitsKph: GaitNumbers
): GaitNumbers {
    const totals = Gait.gaitNumbersZeroed();
    for (const p of ride.paths) {
        for (let _w = 0; _w < p.wayPoints.length - 1; ++_w) {
            const stats = wayPointPairStats(p.wayPoints[_w], p.wayPoints[_w + 1], horseGaitsKph);
            totals[stats.gait] += stats.kilometers;
        }
    }
    return totals;
}

/*
    Sum time per gait respecting gaps between paths for ride pauses
*/
export function getRideMinutesPerGait(
    ride: RideWithoutIds,
    horseGaitsKph: GaitNumbers
): GaitNumbers {
    const totals = Gait.gaitNumbersZeroed();
    for (const p of ride.paths) {
        for (let _w = 0; _w < p.wayPoints.length - 1; ++_w) {
            const stats = wayPointPairStats(p.wayPoints[_w], p.wayPoints[_w + 1], horseGaitsKph);
            totals[stats.gait] += stats.millisec / MS_PER_MINUTE;
        }
    }
    return totals;
}

/*
    Sum total ride time respecting gaps between paths for ride pauses
*/
export function calculateRideTime(ride: RideWithoutIds): number {
    if (ride.endDateTime && ride.paths) {
        // pull the endtime of the first recorded path entry
        // use this value instead of the ride end time to account for pauses and when the end ride modal is open (timer continues to count), more accurate
        const endDate = ride.paths[0].endDateTime;
        const firstPathTime = new Date(endDate).getTime() - new Date(ride.startDateTime).getTime();
        // if there is only one path, return that time
        if (ride.paths.length === 1) {
            return firstPathTime;
        } else if (ride.paths.length > 1) {
            // if there are multiple paths, we need to caclulate the time between the start and end times for each subesequent path to avoid including pauses
            // remove the already accounted for first path, can't modify original so need to make a copy
            const pathArrayCopy = [...ride.paths];
            pathArrayCopy.shift();
            const pathTotals = pathArrayCopy.reduce((total, path) => {
                const startTime = new Date(path.startDateTime);
                const endTime = new Date(path.endDateTime);
                const pathDuration = endTime.getTime() - startTime.getTime();
                // then add those values to the first total
                return total + pathDuration;
            }, firstPathTime);
            return pathTotals;
        }
    }

    // used for when the ride is still in progress/not yet officially ended
    const initialDuration = 0;
    return ride.paths.reduce((total, path) => {
        const endDate = path.endDateTime ? new Date(path.endDateTime) : new Date();
        const pathDuration = endDate.getTime() - new Date(path.startDateTime).getTime();

        return total + pathDuration;
    }, initialDuration);
}
