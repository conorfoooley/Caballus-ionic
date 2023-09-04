export enum RideStatus {
    InProgress = '[RideStatus] inProgress',
    Complete = '[RideStatus] complete'
}

export namespace RideStatus {
    export function toString(type: RideStatus): string {
        switch (type) {
            case RideStatus.InProgress:
                return 'In Progress';
            case RideStatus.Complete:
                return 'Complete';
            default:
                return '';
        }
    }

    export const members: RideStatus[] = [
        RideStatus.InProgress,
        RideStatus.Complete,
    ];
}
