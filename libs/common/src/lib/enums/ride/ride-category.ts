export enum RideCategory {
    Arena = '[RideCategory] arena',
    Competition = '[RideCategory] competition',
    Trail = '[RideCategory] trail',
    HorseWalker = '[RideCategory] horseWalker'
}

export namespace RideCategory {
    export function toString(type: RideCategory): string {
        switch (type) {
            case RideCategory.Arena:
                return 'Arena';
            case RideCategory.Competition:
                return 'Competition';
            case RideCategory.Trail:
                return 'Trail';
            case RideCategory.HorseWalker:
                return 'Horse Walker';
            default:
                return '';
        }
    }

    export const members: RideCategory[] = [
        RideCategory.Arena,
        RideCategory.Competition,
        RideCategory.Trail,
        RideCategory.HorseWalker
    ];
}
