
export enum NotificationCategory {
    Caballus = '[NotificationCategory] caballus',
    Rider = '[NotificationCategory] rider',
    Horse = '[NotificationCategory] horse',
}

export namespace NotificationCategory {
    export function toString(type: NotificationCategory): string {
        switch (type) {
            case NotificationCategory.Caballus:
                return 'Caballus';
            case NotificationCategory.Rider:
                return 'Rider';
            case NotificationCategory.Horse:
                return 'Horse';
            default:
                return '';
        }
    }

    export const members: NotificationCategory[] = [
        NotificationCategory.Caballus,
        NotificationCategory.Rider,
        NotificationCategory.Horse,
    ];
}
