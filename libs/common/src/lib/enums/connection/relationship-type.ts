export enum RelationshipType {
    ActivityPartner = '[RelationshipType] activityPartner',
    Friendship = '[RelationshipType] friendship'
}

export namespace RelationshipType {
    export function toString(type: RelationshipType): string {
        switch (type) {
            case RelationshipType.ActivityPartner:
                return 'Activity Partner';
            case RelationshipType.Friendship:
                return 'Friendship';
            default:
                return '';
        }
    }

    export const members: RelationshipType[] = [
        RelationshipType.ActivityPartner,
        RelationshipType.Friendship
    ];
}
