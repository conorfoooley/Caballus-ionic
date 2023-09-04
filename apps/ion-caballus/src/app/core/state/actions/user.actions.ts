import { User } from '@caballus/ui-common';

enum UserAction {
    ClearUser = '[UserAction] clearUser',
    FetchUser = '[UserAction] fetchUser',
    SetUser = '[UserAction] setUser',
    SetTour = '[UserAction] setTour',
    GetTour = '[UserAction] getTour',
    ResetShowSubscriptionCancelledPopup = '[UserAction] resetShowSubscriptionCancelledPopup',
}

export class FetchUserAction {
    public static readonly type: UserAction = UserAction.FetchUser;
}

export class ClearUserAction {
    public static readonly type: UserAction = UserAction.ClearUser;
}

export class SetTourAction {
    public static readonly type: UserAction = UserAction.SetTour;
}

export class GetTourAction {
    public static readonly type: UserAction = UserAction.GetTour;
}

export class SetUserAction {
    public static readonly type: UserAction = UserAction.SetUser;

    constructor(public user: User) {
    }
}

export class ResetShowSubscriptionCancelledPopup {
    public static readonly type: UserAction = UserAction.ResetShowSubscriptionCancelledPopup;
}
