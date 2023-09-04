export enum UserHorseRelationshipAction {
    CreateHorse = '[UserHorseRelationshipAction] createHorse',
    SetPlaceholder = '[UserHorseRelationshipAction] setPlaceholder',
    Request = '[UserHorseRelationshipAction] request',
    Accept = '[UserHorseRelationshipAction] accept',
    Reject = '[UserHorseRelationshipAction] reject',
    Remove = '[UserHorseRelationshipAction] remove'
}

export namespace UserHorseRelationshipAction {
    export function toString(type: UserHorseRelationshipAction): string {
        switch (type) {
            case UserHorseRelationshipAction.CreateHorse:
                return 'Created Horse';
            case UserHorseRelationshipAction.SetPlaceholder:
                return 'Set Placeholder';
            case UserHorseRelationshipAction.Request:
                return 'Requested';
            case UserHorseRelationshipAction.Accept:
                return 'Accepted';
            case UserHorseRelationshipAction.Reject:
                return 'Rejected';
            case UserHorseRelationshipAction.Remove:
                return 'Removed';
            default:
                return '';
        }
    }

    export const members: UserHorseRelationshipAction[] = [
        UserHorseRelationshipAction.CreateHorse,
        UserHorseRelationshipAction.SetPlaceholder,
        UserHorseRelationshipAction.Request,
        UserHorseRelationshipAction.Accept,
        UserHorseRelationshipAction.Reject,
        UserHorseRelationshipAction.Remove
    ];
}
