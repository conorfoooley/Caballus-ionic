export enum HorsePermission {
    // Not sure what all the permissions here are going to be. Just adding some basic ones as a guess for now
    // Guessing the horseView and horseEdit are going to need to be split out more to allow viewing or editing of specific things and not others?
    HorseView = '[HorsePermission] horseView',
    HorseEdit = '[HorsePermission] horseEdit',
    HorseDelete = '[HorsePermission] horseDelete',
    HorseRide = '[HorsePermission] horseRide',
    HorseEnable = '[HorsePermission] horseEnable',
    HorseInvite = '[HorsePermission] horseInvite',
    HorseTransferOwnership = '[HorsePermission] horseTransferOwnership'
}

export namespace HorsePermission {
    export function toString(type: HorsePermission): string {
        switch (type) {
            case HorsePermission.HorseView:
                return 'View Horse';
            case HorsePermission.HorseEdit:
                return 'Edit Horse';
            case HorsePermission.HorseDelete:
                return 'Delete Horse';
            case HorsePermission.HorseRide:
                return 'Ride Horse';
            case HorsePermission.HorseEnable:
                return 'Horse Enable';
            case HorsePermission.HorseInvite:
                return 'Horse Invite';
            case HorsePermission.HorseTransferOwnership:
                return 'Horse Transfer';
            default:
                return '';
        }
    }

    export const members: HorsePermission[] = [
        HorsePermission.HorseView,
        HorsePermission.HorseEdit,
        HorsePermission.HorseDelete,
        HorsePermission.HorseRide,
        HorsePermission.HorseEnable,
        HorsePermission.HorseInvite,
        HorsePermission.HorseTransferOwnership
    ];
}
