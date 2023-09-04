import { NotificationCategory } from './notification-category';

// Underscores in enum for use as keys in mongo
export enum NotificationType {
    NewConnectionMade = '[NotificationType]_newConnectionMade',
    NewConnectionAccepted = '[NotificationType]_newConnectionAccepted',
    NewConnectionJoined = '[NotificationType]_newConnectionJoined',
    RequestForActivities = '[NotificationType]_requestForActivities',
    NewMessage = '[NotificationType]_newMessage',
    NewHobbyOrInterestAdded = '[NotificationType]_newHobbyOrInterestAdded',
    NewConnectionRequest = '[NotificationType]_newConnectionRequest',
    FriendInvite = '[NotificationType]_friendInvite',
    FriendAccept = '[NotificationType]_friendAccept',
    FriendReject = '[NotificationType]_friendReject',
    FriendBlock = '[NotificationType]_friendBlock',
    GroupPostNew = '[NotificationType]_groupPostNew',
    GroupPostLiked = '[NotificationType]_groupPostLiked',
    GroupPostComment = '[NotificationType]_groupPostComment',
    GroupPostShared = '[NotificationType]_groupPostShared',
    GroupPostTagged = '[NotificationType]_groupPostTagged',
    GroupInvited = '[NotificationType]_groupInvited',
    WallPostLiked = '[NotificationType]_wallPostLiked',
    WallPostComment = '[NotificationType]_wallPostComment',
    WallPostShared = '[NotificationType]_wallPostShared',
    WallPostTagged = '[NotificationType]_wallPostTagged',
    DisplayNameChanged = '[NotificationType]_displayNameChanged',
    PasswordChanged = '[NotificationType]_passwordChanged',
    RideEnded = '[NotificationType]_rideEnded',
    ProfileDetailsChanged = '[NotificationType]_profileDetilsChanged'
}

export namespace NotificationType {
    export function toString(type: NotificationType): string {
        switch (type) {
            case NotificationType.NewConnectionMade:
                return 'New Connection Made';
            case NotificationType.NewConnectionAccepted:
                return 'New Connection Accepted';
            case NotificationType.NewConnectionJoined:
                return 'New Connection Joined';
            case NotificationType.NewConnectionRequest:
                return 'New Connection Request';
            case NotificationType.RequestForActivities:
                return 'Request For Activities';
            case NotificationType.FriendAccept:
                return 'Friend Accept';
            case NotificationType.FriendInvite:
                return 'Friend Invite';
            case NotificationType.FriendReject:
                return 'Friend Reject';
            case NotificationType.FriendBlock:
                return 'Friend Block';
            case NotificationType.NewMessage:
                return 'New Message';
            case NotificationType.NewHobbyOrInterestAdded:
                return 'New Hobby or Interest Added';
            case NotificationType.GroupPostNew:
                return 'new Group Post';
            case NotificationType.GroupPostLiked:
                return 'Group Post Liked';
            case NotificationType.GroupPostComment:
                return 'Group Post Comment';
            case NotificationType.GroupPostShared:
                return 'Group Post Shared';
            case NotificationType.GroupPostTagged:
                return 'Tagged In Group Post';
            case NotificationType.GroupInvited:
                return 'Invited to Group';
            case NotificationType.WallPostLiked:
                return 'Wall Post Liked';
            case NotificationType.WallPostComment:
                return 'Wall Post Comment';
            case NotificationType.WallPostShared:
                return 'Wall Post Shared';
            case NotificationType.WallPostTagged:
                return 'Tagged In Wall Post';
            case NotificationType.DisplayNameChanged:
                return 'Display Name Changed';
            case NotificationType.PasswordChanged:
                return 'Password Changed';
            case NotificationType.ProfileDetailsChanged:
                return 'Profile Details Changed';
            default:
                return '';
        }
    }

    export function membersByCategory(category: NotificationCategory): NotificationType[] {
        switch (category) {
            case NotificationCategory.Rider:
                return [
                    NotificationType.NewHobbyOrInterestAdded,
                    NotificationType.NewConnectionJoined,
                    NotificationType.FriendAccept,
                    NotificationType.FriendBlock,
                    NotificationType.FriendInvite,
                    NotificationType.FriendReject
                ];
            case NotificationCategory.Horse:
                return [
                    NotificationType.NewConnectionAccepted,
                    NotificationType.NewConnectionMade,
                    NotificationType.NewConnectionRequest,
                    NotificationType.NewMessage,
                    NotificationType.RequestForActivities
                ];
            case NotificationCategory.Caballus:
                return [
                    NotificationType.GroupPostNew,
                    NotificationType.GroupPostLiked,
                    NotificationType.GroupPostComment,
                    NotificationType.GroupPostShared,
                    NotificationType.GroupPostTagged,
                    NotificationType.GroupInvited
                ];

            default:
                return [];
        }
    }

    export const members: NotificationType[] = [
        NotificationType.NewConnectionMade,
        NotificationType.NewConnectionAccepted,
        NotificationType.NewConnectionJoined,
        NotificationType.NewConnectionRequest,
        NotificationType.RequestForActivities,
        NotificationType.NewMessage,
        NotificationType.NewHobbyOrInterestAdded,
        NotificationType.GroupPostNew,
        NotificationType.FriendAccept,
        NotificationType.FriendBlock,
        NotificationType.FriendInvite,
        NotificationType.FriendReject,
        NotificationType.GroupPostLiked,
        NotificationType.GroupPostComment,
        NotificationType.GroupPostShared,
        NotificationType.GroupPostTagged,
        NotificationType.GroupInvited,
        NotificationType.WallPostLiked,
        NotificationType.WallPostComment,
        NotificationType.WallPostShared,
        NotificationType.WallPostTagged,
        NotificationType.DisplayNameChanged,
        NotificationType.PasswordChanged,
        NotificationType.ProfileDetailsChanged
    ];
}
