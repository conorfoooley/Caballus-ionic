export enum InvitationStatus {
    Sent = '[InvitationStatus] sent',
    Retracted = '[InvitationStatus] retracted',
    Accepted = '[InvitationStatus] accepted',
    Rejected = '[InvitationStatus] rejected'
}

export namespace InvitationStatus {
    export function toString(s: InvitationStatus): string {
        switch (s) {
            case InvitationStatus.Sent:
                return 'Sent';
            case InvitationStatus.Retracted:
                return 'Retracted';
            case InvitationStatus.Accepted:
                return 'Accepted';
            case InvitationStatus.Rejected:
                return 'Rejected';
            default:
                return '';
        }
    }

    export const members: InvitationStatus[] = [
        InvitationStatus.Sent,
        InvitationStatus.Retracted,
        InvitationStatus.Accepted,
        InvitationStatus.Rejected
    ];

    export function validTransition(from: InvitationStatus, to: InvitationStatus): boolean {
        const VALID_TRANSITIONS: { [key in InvitationStatus]: { [k in InvitationStatus]: boolean } } = {
            [InvitationStatus.Sent]: {
                [InvitationStatus.Sent]: false,
                [InvitationStatus.Retracted]: true,
                [InvitationStatus.Accepted]: true,
                [InvitationStatus.Rejected]: true
            },
            [InvitationStatus.Retracted]: {
                [InvitationStatus.Sent]: false,
                [InvitationStatus.Retracted]: false,
                [InvitationStatus.Accepted]: false,
                [InvitationStatus.Rejected]: false
            },
            [InvitationStatus.Accepted]: {
                [InvitationStatus.Sent]: false,
                [InvitationStatus.Retracted]: false,
                [InvitationStatus.Accepted]: false,
                [InvitationStatus.Rejected]: false
            },
            [InvitationStatus.Rejected]: {
                [InvitationStatus.Sent]: false,
                [InvitationStatus.Retracted]: false,
                [InvitationStatus.Accepted]: false,
                [InvitationStatus.Rejected]: false
            }
        } as const;
        return VALID_TRANSITIONS[from][to];
    }
}
