export enum ReadStatus {
    Read = '[ReadStatus] read',
    Unread = '[ReadStatus] unread'
}

export namespace ReadStatus {
    export function toString(type: ReadStatus): string {
        switch (type) {
            case ReadStatus.Read:
                return 'Read';
            case ReadStatus.Unread:
                return 'Unread';
            default:
                return '';
        }
    }

    export const members: ReadStatus[] = [
        ReadStatus.Read,
        ReadStatus.Unread
    ];
}
