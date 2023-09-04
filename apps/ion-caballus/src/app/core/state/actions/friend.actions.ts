enum FriendAction {
    ClearFriends = '[FriendAction] clearFriends',
    FetchFriends = '[FriendAction] fetchFriends'
}

export class FetchFriendsAction {
    public static readonly type: FriendAction = FriendAction.FetchFriends;
}

export class ClearFriendsAction {
    public static readonly type: FriendAction = FriendAction.ClearFriends;
}
