export enum HorseProfileStatus {
    Active = '[HorseProfileStatus] active',
    Disabled = '[HorseProfileStatus] disabled'
}

export namespace HorseProfileStatus {
    export function toString(type: HorseProfileStatus): string {
        switch (type) {
            case HorseProfileStatus.Active:
                return 'Active';
            case HorseProfileStatus.Disabled:
                return 'Disabled';
            default:
                return '';
        }
    }

    export const members: HorseProfileStatus[] = [
        HorseProfileStatus.Active,
        HorseProfileStatus.Disabled
    ];
}
