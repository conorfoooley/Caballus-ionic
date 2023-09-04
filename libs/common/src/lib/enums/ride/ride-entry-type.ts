export enum RideEntryType {
    RealTime = '[RideEntryType] realTime',
    Manual = '[RideEntryType] manual'
}

export namespace RideEntryType {
    export function toString(type: RideEntryType): string {
        switch (type) {
            case RideEntryType.RealTime:
                return 'Real Time';
            case RideEntryType.Manual:
                return 'Manual';
            default:
                return '';
        }
    }

    export const members: RideEntryType[] = [
        RideEntryType.RealTime,
        RideEntryType.Manual,
    ];
}
