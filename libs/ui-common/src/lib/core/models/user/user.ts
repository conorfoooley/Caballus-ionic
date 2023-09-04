import { UserWithoutIds, Permission, UserSettings, UserDeviceInfo, UserNotificationSetting } from '@caballus/common';
import { UserIdentity } from './user-identity';
import { UserProfile } from './user-profile';
import { UserBilling } from './user-billing';

export class User extends UserWithoutIds {
    public _id: string;
    public roleIds: string[] = [];
    public profile: UserProfile = new UserProfile();
    /*
        permissions for ui-common model populated on
        login using getLoggedInUser() endpoint
    */
    public permissions: Permission[] = [];
    public settings!: UserSettings;
    public deviceInfo: UserDeviceInfo[] = [];
    public billing: UserBilling;
    public userNotificationSetting: UserNotificationSetting;

    constructor(params?: Partial<User>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.roleIds = Array.isArray(params.roleIds)
                ? params.roleIds
                : this.roleIds;
            this.profile = !!params.profile
                ? new UserProfile(params.profile)
                : this.profile;
            this.permissions = Array.isArray(params.permissions)
                ? params.permissions
                : this.permissions;
            this.settings = !!params.settings
                ? new UserSettings(params.settings)
                : this.settings;
            this.deviceInfo = Array.isArray(params.deviceInfo)
                ? params.deviceInfo
                : this.deviceInfo;
            this.billing = !!params.userNotificationSetting ? new UserBilling(params.billing) : this.billing;
            this.userNotificationSetting = !!params.userNotificationSetting ? new UserNotificationSetting(params.userNotificationSetting) : this.userNotificationSetting;
        }
    }

    public toIdentity(): UserIdentity {
        return new UserIdentity({
            _id: this._id,
            label: `${this.profile.firstName} ${this.profile.lastName}`,
            picture: this.profile.profilePicture
        });
    }
}
