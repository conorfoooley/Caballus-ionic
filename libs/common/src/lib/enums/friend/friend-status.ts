export enum FriendStatus {
    Friends = '[FriendStatus] friends',
    Rejected = '[FriendStatus] rejected',
    Requested = '[FriendStatus] requested',
    Blocked = '[FriendStatus] blocked'
}

export namespace FriendStatus {
    export function toString(s: FriendStatus): string {
        switch (s) {
            case FriendStatus.Friends:
                return 'Friends';
            case FriendStatus.Rejected:
                return 'Rejected';
            case FriendStatus.Requested:
                return 'Requested';
            case FriendStatus.Blocked:
                return 'Blocked';
            default:
                return ''
        }
    }

    export const members: FriendStatus[] = [
        FriendStatus.Friends,
        FriendStatus.Requested,
        FriendStatus.Blocked,
        FriendStatus.Rejected
    ]
}
