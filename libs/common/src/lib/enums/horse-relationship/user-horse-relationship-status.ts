export enum UserHorseRelationshipStatus {
    Placeholder = '[UserHorseRelationshipStatus] placeholder',
    Pending = '[UserHorseRelationshipStatus] pending',
    Connected = '[UserHorseRelationshipStatus] connected',
    Rejected = '[UserHorseRelationshipStatus] rejected',
    Removed = '[UserHorseRelationshipStatus] removed'
}

export namespace UserHorseRelationshipStatus {
    export function toString(type: UserHorseRelationshipStatus): string {
        switch (type) {
            case UserHorseRelationshipStatus.Placeholder:
                return 'Placeholder';
            case UserHorseRelationshipStatus.Pending:
                return 'Pending';
            case UserHorseRelationshipStatus.Connected:
                return 'Connected';
            case UserHorseRelationshipStatus.Rejected:
                return 'Rejected';
            case UserHorseRelationshipStatus.Removed:
                return 'Removed';
            default:
                return '';
        }
    }

    export const members: UserHorseRelationshipStatus[] = [
        UserHorseRelationshipStatus.Placeholder,
        UserHorseRelationshipStatus.Pending,
        UserHorseRelationshipStatus.Connected,
        UserHorseRelationshipStatus.Rejected,
        UserHorseRelationshipStatus.Removed
    ];

    /**
     *
     * For use in determining what role a user holds with a horse when the relationship is transitioning
     * Returns the most connected status, or null if statuses are equal
     */
    export function highestStatus(status1: UserHorseRelationshipStatus, status2: UserHorseRelationshipStatus): UserHorseRelationshipStatus {
        const statusesOrderedByConnectionDegree = [
            UserHorseRelationshipStatus.Connected,
            UserHorseRelationshipStatus.Pending,
            UserHorseRelationshipStatus.Placeholder,
            UserHorseRelationshipStatus.Removed,
            UserHorseRelationshipStatus.Rejected
        ];

        if (statusesOrderedByConnectionDegree.indexOf(status1) < statusesOrderedByConnectionDegree.indexOf(status2)) {
            return status1;
        } else if (statusesOrderedByConnectionDegree.indexOf(status1) > statusesOrderedByConnectionDegree.indexOf(status2)) {
            return status2;
        } else {
            return null;
        }
    }
}
