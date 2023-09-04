export class AllowNotificationSetting {
    public onNewDataAddedOnHorse: boolean = false;
    public onHorseFollowNewActivity: boolean = false;
    public onFriendHasNewActivity: boolean = false;

    constructor(params?: Partial<AllowNotificationSetting>) {
        this.onNewDataAddedOnHorse = params?.onNewDataAddedOnHorse || this.onNewDataAddedOnHorse;
        this.onHorseFollowNewActivity = params?.onHorseFollowNewActivity || this.onHorseFollowNewActivity;
        this.onFriendHasNewActivity = params?.onFriendHasNewActivity || this.onFriendHasNewActivity;
    }
}
