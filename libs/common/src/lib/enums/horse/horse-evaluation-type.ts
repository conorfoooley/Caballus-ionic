export enum HorseEvaluationType {
    Performance = '[HorseEvaluationType] performance',
    Conformation = '[HorseEvaluationType] conformation'
}

export namespace HorseEvaluationType {
    export function toString(type: HorseEvaluationType): string {
        switch (type) {
            case HorseEvaluationType.Performance:
                return 'Performance';
            case HorseEvaluationType.Conformation:
                return 'Conformation';
            default:
                return '';
        }
    }

    export const members: HorseEvaluationType[] = [
        HorseEvaluationType.Performance,
        HorseEvaluationType.Conformation
    ];
}
