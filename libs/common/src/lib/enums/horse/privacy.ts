export enum Privacy {
    Private = '[Privacy] private',
    Public = '[Privacy] public'
}

export namespace Privacy {
    export function toString(type: Privacy): string {
        switch (type) {
            case Privacy.Private:
                return 'Private';
            case Privacy.Public:
                return 'Public';
            default:
                return '';
        }
    }

    export const members: Privacy[] = [
        Privacy.Private,
        Privacy.Public
    ];

    const PRIVACY_DEFAULT = {
        overallPrivacy: Privacy.Private,
        bio: Privacy.Public,
        media: Privacy.Public,
        rideHistory: Privacy.Public,
        studentsAndTrainers: Privacy.Private,
        ownerDetails: Privacy.Private,
        gaitTotals: Privacy.Private,
        gaitSettings: Privacy.Private,
        medicalHistory: Privacy.Private,
        performanceEvaluations: Privacy.Public,
        competitions: Privacy.Public
    } as const;

    export function defaultPrivacy(): {
        overallPrivacy: Privacy,
        bio: Privacy,
        media: Privacy,
        rideHistory: Privacy,
        studentsAndTrainers: Privacy,
        ownerDetails: Privacy,
        gaitTotals: Privacy,
        gaitSettings: Privacy,
        medicalHistory: Privacy,
        performanceEvaluations: Privacy,
        competitions: Privacy
    } {
        return { ...PRIVACY_DEFAULT };
    }

}
