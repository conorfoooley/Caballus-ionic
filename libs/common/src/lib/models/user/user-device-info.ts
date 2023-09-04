import { UserAppInfo } from './user-app-info';

export class UserDeviceInfo {
    public deviceId: string;
    public os: string;
    public osVersion: string;
    public deviceName: string;
    public deviceModel: string;
    public ramAvailable: number;
    public platform: string;
    public appInfo: UserAppInfo[] = [];

    constructor(params?: Partial<UserDeviceInfo>) {
        if (!!params) {
            this.deviceId = params.deviceId || this.deviceId;
            this.os = params.os || this.os;
            this.osVersion = params.osVersion || this.osVersion;
            this.deviceName = params.deviceName || this.deviceName;
            this.deviceModel = params.deviceModel || this.deviceModel;
            this.ramAvailable = params.ramAvailable || this.ramAvailable;
            this.platform = params.platform || this.platform;
            this.appInfo = Array.isArray(params.appInfo)
            ? params.appInfo.map(a => new UserAppInfo(a))
            : this.appInfo;
        }
    }
}
