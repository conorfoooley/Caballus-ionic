export enum HorseBreed {
    QuarterHorse = '[HorseBreed] quarterHorse',
    ThoroughBred = '[HorseBreed] thoroughBred',
    Arabian = '[HorseBreed] arabian',
    WarmBlood = '[HorseBreed] warmBlood',
    Paint = '[HorseBreed] paint',
    DraftColdBlood = '[HorseBreed] draftColdBlood',
    Pony = '[HorseBreed] pony',
    Gaited = '[HorseBreed] gaited',
    Other = '[HorseBreed] other'
}

export namespace HorseBreed {
    export function toString(type: HorseBreed): string {
        switch (type) {
            case HorseBreed.QuarterHorse:
                return 'Quarter Horse';
            case HorseBreed.ThoroughBred:
                return 'Thorough Bred';
            case HorseBreed.Arabian:
                return 'Arabian';
            case HorseBreed.WarmBlood:
                return 'Warm Blood';
            case HorseBreed.Paint:
                return 'Paint';
            case HorseBreed.DraftColdBlood:
                return 'Draft Cold Blood';
            case HorseBreed.Pony:
                return 'Pony';
            case HorseBreed.Gaited:
                return 'Gaited';
            case HorseBreed.Other:
                return 'Other';
            default:
                return '';
        }
    }

    export const members: HorseBreed[] = [
        HorseBreed.QuarterHorse,
        HorseBreed.ThoroughBred,
        HorseBreed.Arabian,
        HorseBreed.WarmBlood,
        HorseBreed.Paint,
        HorseBreed.DraftColdBlood,
        HorseBreed.Pony,
        HorseBreed.Gaited,
        HorseBreed.Other
    ];
}
