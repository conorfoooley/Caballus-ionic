export enum NotificationFrequency {
    Immediate = '[NotificationFrequency] immediate',
    Daily = '[NotificationFrequency] daily',
    Weekly = '[NotificationFrequency] weekly',
    Monthly = '[NotificationFrequency] monthly'
}

export namespace NotificationFrequency {
    export function toString(type: NotificationFrequency): string {
        switch (type) {
            case NotificationFrequency.Immediate:
                return 'Immediate';
            case NotificationFrequency.Daily:
                return 'Daily';
            case NotificationFrequency.Weekly:
                return 'Weekly';
            case NotificationFrequency.Monthly:
                return 'Monthly';
            default:
                return '';
        }
    }

    export const members: NotificationFrequency[] = [
        NotificationFrequency.Immediate,
        NotificationFrequency.Daily
    ];
}
