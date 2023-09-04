import { User, UserDeviceInfo } from '@caballus/ui-common';

enum AuthAction {
    Login = '[AuthAction] login',
    Logout = '[AuthAction] logout',
    Refresh = '[AuthAction] refresh',
    RestoreSession = '[AuthAction] restoreSession'
}


export class LoginAction {
    public static readonly type: AuthAction = AuthAction.Login;
    constructor(public email: string, public password: string, public deviceInfo?: UserDeviceInfo) {}
}

export class LogoutAction {
    public static readonly type: AuthAction = AuthAction.Logout;
    constructor(public redirect: boolean = true) {}
}

export class RefreshAction {
    public static readonly type: AuthAction = AuthAction.Refresh;
}

export class RestoreSessionAction {
    public static readonly type: AuthAction = AuthAction.RestoreSession;
    constructor(
        public user: User,
        public refresh: string,
        public token: string
    ) {}
}
