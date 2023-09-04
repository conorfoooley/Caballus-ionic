export enum HorseHealthType {
    Farrier = '[HorseHealthType] Farrier',
    Vaccination = '[HorseHealthType] vaccination',
    Health = '[HorseHealthType] health',
    Evaluation = '[HorseHealthType] evaluation'
}

export namespace HorseHealthType {
    export function toString(type: HorseHealthType): string {
        switch (type) {
            case HorseHealthType.Farrier:
                return 'Farrier';
            case HorseHealthType.Vaccination:
                return 'Vaccination';
            case HorseHealthType.Health:
                return 'Health';
            case HorseHealthType.Evaluation:
                return 'Evaluation';
            default:
                return '';
        }
    }

    export const members: HorseHealthType[] = [
        HorseHealthType.Farrier,
        HorseHealthType.Vaccination,
        HorseHealthType.Health,
        HorseHealthType.Evaluation
    ];
}
