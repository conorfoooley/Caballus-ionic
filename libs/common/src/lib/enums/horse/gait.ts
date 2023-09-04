import { GaitNumbers } from '../../types';

export enum Gait {
    None = '[Gait]_none',
    Walk = '[Gait]_walk',
    Trot = '[Gait]_trot',
    Lope = '[Gait]_lope',
    Gallop = '[Gait]_gallop'
}

export namespace Gait {
    export function toString(type: Gait): string {
        switch (type) {
            case Gait.None:
                return 'None';
            case Gait.Walk:
                return 'Walk';
            case Gait.Trot:
                return 'Trot';
            case Gait.Lope:
                return 'Lope';
            case Gait.Gallop:
                return 'Gallop';
            default:
                return '';
        }
    }

    const KILOMETERS_PER_HOUR_DEFAULT: GaitNumbers = {
        [Gait.None]: 0,
        [Gait.Walk]: 3.21869, // appx 2 miles per hour
        [Gait.Trot]: 8.04672, // appx 5 miles per hour
        [Gait.Lope]: 14.4841, // appx 9 miles per hour
        [Gait.Gallop]: 30.5775 // appx 19 miles per hour
    } as const;
    /*
        Define ordering of gait members according
        to ascending default kph speed
    */
    export const members: Gait[] = Object.entries(KILOMETERS_PER_HOUR_DEFAULT)
        .sort((a, b) => a[1] < b[1] ? -1 : 1)
        .map(entry => entry[0] as Gait);

    export function defaultKilometersPerHour(): GaitNumbers {
        return { ...KILOMETERS_PER_HOUR_DEFAULT };
    }

    export function gaitNumbersZeroed(): GaitNumbers {
        const reduced: { [key in Gait]?: number } =
            members.reduce((a, c) => ({ ...a, [c]: 0 }), {});
        return reduced as GaitNumbers;
    }

    export function gaitNumbersNulled(): GaitNumbers {
        const reduced: { [key in Gait]?: number } =
            members.reduce((a, c) => ({ ...a, [c]: null }), {});
        return reduced as GaitNumbers;
    }
}
