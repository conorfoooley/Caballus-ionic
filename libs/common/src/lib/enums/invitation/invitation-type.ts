export enum InvitationType {
    OwnershipTransfer = '[InvitationType] ownershipTransfer',
    SubscriptionTransfer = '[InvitationType] subscriptionTransfer',
    General = '[InvitationType] general'
}

export namespace InvitationType {
    export function toString(s: InvitationType): string {
        switch (s) {
            case InvitationType.OwnershipTransfer:
                return 'Ownership Transfer';
            case InvitationType.SubscriptionTransfer:
                return 'Subscription Transfer';
            case InvitationType.General:
                return 'General';
            default:
                return '';
        }
    }

    export const members: InvitationType[] = [
        InvitationType.OwnershipTransfer,
        InvitationType.SubscriptionTransfer,
        InvitationType.General
    ];
}
