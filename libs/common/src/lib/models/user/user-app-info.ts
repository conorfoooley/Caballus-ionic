export class UserAppInfo {
    public loginAt: Date;
    public appVersion: string;

    constructor(params?: Partial<UserAppInfo>) {
        if (!!params) {
            this.loginAt = params.loginAt || this.loginAt;
            this.appVersion = params.appVersion || this.appVersion;
        }
    }
}
