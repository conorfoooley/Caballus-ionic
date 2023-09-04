import { WayPoint, RidePath, RideWithoutIds } from '../models';
import {
    degToRad,
    wayPointKilometers,
    getKphGait,
    wayPointPairStats,
    getRideKilometers,
    getRideKilometersPerGait,
    getRideMinutesPerGait
} from './ride-calculations';
import { Gait } from '../enums';
import { GaitNumbers } from '../types';
import { MS_PER_HOUR } from '../constants';

const MarkMS = (new Date('2021-01-01T00:00:00.000Z')).getTime();

const WayPoints: WayPoint[] = [
    new WayPoint({
        latitude: 43.57714674307984,
        longitude: -116.21364753762599,
        altitude: 0,
        timestamp: new Date(MarkMS)
    }),
    new WayPoint({ // appx 0.2017 km from previous
        latitude: 43.578961992095294,
        longitude: -116.2136332407891,
        altitude: 0,
        timestamp: new Date(MarkMS + 726667)
    }),
    new WayPoint({ // appx 0.1834 km from previous
        latitude: 43.580612315411784,
        longitude: -116.21361922662636,
        altitude: 0,
        timestamp: new Date(MarkMS + 858796)
    }),
    new WayPoint({ // appx 0.2063 km from previous
        latitude: 43.58246905051798,
        longitude: -116.21363349576006,
        altitude: 0,
        timestamp: new Date(MarkMS + 941382)
    }),
    new WayPoint({ // appx 0.1921 km from previous
        latitude: 43.582479360820514,
        longitude: -116.21125542524693,
        altitude: 0,
        timestamp: new Date(MarkMS + 987355)
    }),
    new WayPoint({ // appx 0.2026 km from previous
        latitude: 43.58257126186957,
        longitude: -116.20875028899603,
        altitude: 0,
        timestamp: new Date(MarkMS + 1010085)
    }),
    new WayPoint({ // appx 0.1662 km from previous
        latitude: 43.58107602579775,
        longitude: -116.20867906861912,
        altitude: 0,
        timestamp: new Date(MarkMS + 1050012)
    }),
    new WayPoint({ // appx 0.1364 km from previous
        latitude: 43.57984841000022,
        longitude: -116.208668301746,
        altitude: 0,
        timestamp: new Date(MarkMS + 1104616)
    }),
    new WayPoint({ // appx 0.2998 km from previous
        latitude: 43.57714971141165,
        longitude: -116.20868460372746,
        altitude: 0,
        timestamp: new Date(MarkMS + 1320679)
    }),
    new WayPoint({ // appx 0.3848 km from previous
        latitude: 43.57713611910946,
        longitude: -116.21344831645247,
        altitude: 0,
        timestamp: new Date(MarkMS + 2702169)
    })
]

const WayPointPairs: { a: WayPoint, b: WayPoint }[] = [
    { a: WayPoints[0], b: WayPoints[1] },
    { a: WayPoints[1], b: WayPoints[2] },
    { a: WayPoints[2], b: WayPoints[3] },
    { a: WayPoints[3], b: WayPoints[4] },
    { a: WayPoints[4], b: WayPoints[5] },
    { a: WayPoints[5], b: WayPoints[6] },
    { a: WayPoints[6], b: WayPoints[7] },
    { a: WayPoints[7], b: WayPoints[8] },
    { a: WayPoints[8], b: WayPoints[9]}
];

const WayPointPairData: {
    pair: { a: WayPoint; b: WayPoint };
    kilometers: number;
    elapsedMS: number;
    kph: number;
    gait: Gait;
}[] = [
    { pair: WayPointPairs[0], kilometers: 0.2018520160310017, elapsedMS: 726667, kph: 1, gait: Gait.None },
    { pair: WayPointPairs[1], kilometers: 0.18351309730089252, elapsedMS: 132129, kph: 5, gait: Gait.Walk },
    { pair: WayPointPairs[2], kilometers: 0.20646502404151942, elapsedMS: 82586, kph: 9, gait: Gait.Trot },
    { pair: WayPointPairs[3], kilometers: 0.19155364966810187, elapsedMS: 45973, kph: 15, gait: Gait.Lope },
    { pair: WayPointPairs[4], kilometers: 0.20204361007048327, elapsedMS: 22730, kph: 32, gait: Gait.Gallop },
    { pair: WayPointPairs[5], kilometers: 0.16636345889838677, elapsedMS: 39927, kph: 15, gait: Gait.Lope },
    { pair: WayPointPairs[6], kilometers: 0.13650892489621722, elapsedMS: 54604, kph: 9, gait: Gait.Trot },
    { pair: WayPointPairs[7], kilometers: 0.30008780905371885, elapsedMS: 216063, kph: 5, gait: Gait.Walk },
    { pair: WayPointPairs[8], kilometers: 0.3837472812600898, elapsedMS: 1381490, kph: 1, gait: Gait.None }
];

const MockGaitProfile: GaitNumbers = {
    [Gait.None]: 0,
    [Gait.Walk]: 3.21869, // appx 2 miles per hour
    [Gait.Trot]: 8.04672, // appx 5 miles per hour
    [Gait.Lope]: 14.4841, // appx 9 miles per hour
    [Gait.Gallop]: 30.5775 // appx 19 miles per hour
};

describe('Ride Calculations', () => {

    it('should convert degrees to radians', () => {
        const pairs = [
            [45, (Math.PI / 4)],
            [90, (Math.PI / 2)],
            [135, (3 * Math.PI / 4)],
            [180, Math.PI],
            [225, (5 * Math.PI / 4)],
            [270, (3 * Math.PI / 2)],
            [315, (7 * Math.PI / 4)],
            [360, (2 * Math.PI)]
        ];
        for (const p of pairs) {
            const degrees = p[0];
            const expectedRadians = p[1];
            const radians = degToRad(degrees);
            expect(radians).toBe(expectedRadians);
        }
    });

    it('should calculate kilometers between two waypoints', () => {
        for (const d of WayPointPairData) {
            const expectedKilometers = d.kilometers;
            const kilometers = wayPointKilometers(d.pair.a, d.pair.b);
            expect(kilometers).toBe(expectedKilometers);
        }
    });

    it('should assign kph values to gaits', () => {
        for (const d of WayPointPairData) {
            const expectedGait = d.gait;
            const gait = getKphGait(d.kph, MockGaitProfile);
            expect(gait).toBe(expectedGait);
        }
    });

    it('should calculate stats for coordinate pairs', () => {
        for (const d of WayPointPairData) {
            const expectedKilometers = d.kilometers;
            const expectedMillisec = d.elapsedMS;
            const expectedGait = d.gait;
            const { kilometers, millisec, gait } = wayPointPairStats(
                d.pair.a,
                d.pair.b,
                MockGaitProfile
            );
            expect(kilometers).toBe(expectedKilometers);
            expect(millisec).toBe(expectedMillisec);
            expect(gait).toBe(expectedGait);
        }
    });

    it('should calculate the total km for a ride', () => {
        const ride = new RideWithoutIds({ paths: [new RidePath({ wayPoints: WayPoints })] });
        const expectedKilometers = 1.9721348712204112; // sum of above waypoints
        const kilometers = getRideKilometers(ride);
        expect(kilometers).toBe(expectedKilometers);
    });

    it('should divvy ride kilometers across gaits', () => {
        const ride = new RideWithoutIds({ paths: [new RidePath({ wayPoints: WayPoints })] });
        const expectedGaitKilometers: GaitNumbers = {
            '[Gait]_none': 0.5855992972910915,
            '[Gait]_walk': 0.4836009063546114,
            '[Gait]_trot': 0.34297394893773664,
            '[Gait]_lope': 0.3579171085664886,
            '[Gait]_gallop': 0.20204361007048327
        };
        const gaitKilometers = getRideKilometersPerGait(ride, MockGaitProfile);
        expect(gaitKilometers).toEqual(expectedGaitKilometers);
    });

    it('should divvy ride minutes across gaits', () => {
        const ride = new RideWithoutIds({ paths: [new RidePath({ wayPoints: WayPoints })] });
        const expectedGaitMinutes: GaitNumbers = {
            '[Gait]_none': 35.13595,
            '[Gait]_walk': 5.8032,
            '[Gait]_trot': 2.2865,
            '[Gait]_lope': 1.4316666666666666,
            '[Gait]_gallop': 0.37883333333333336
        };
        const gaitMinutes = getRideMinutesPerGait(ride, MockGaitProfile);
        expect(gaitMinutes).toEqual(expectedGaitMinutes);
    });
});
