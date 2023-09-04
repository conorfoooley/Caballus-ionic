import { BaseDoc } from '../base/base-doc';
import { UserToHorseSummaryWithoutIds } from '../horse-relationship/user-to-horse-summary';
import { UserDeviceInfo } from './user-device-info';
import { UserIdentityWithoutIds } from './user-identity';
import { UserProfileWithoutIds } from './user-profile';
import { UserSettings } from './user-settings';
import { UserBillingWithoutIds } from './user-billing';
import { BaseMediaDocument } from '../media/base-media-document';
import { UserNotificationSetting } from './user-notification-setting';
import { HorseIdentityWithoutIds } from '../horse/horse-identity';

/**
 * Does not include password or other sensitive fields, for that see the
 * `FullUserWithoutIds` class.
 */

export class UserWithoutIds extends BaseDoc {
    public _id: any;
    public roleIds: any[] = [];
    public profile: UserProfileWithoutIds = new UserProfileWithoutIds();
    public settings: UserSettings = new UserSettings();
    public deviceInfo: UserDeviceInfo[] = null;
    public billing: UserBillingWithoutIds = new UserBillingWithoutIds({});
    public displayName: string = '';
    public profileUrl: string = '';
    public profilePicture: BaseMediaDocument = null;
    public profilePublic: boolean = false;
    public isTour: boolean = true;
    public userNotificationSetting: UserNotificationSetting = new UserNotificationSetting();

    // Only set on login
    public horseRelationships: UserToHorseSummaryWithoutIds[] = [];
    public followedHorses: HorseIdentityWithoutIds[] = [];

    constructor(params?: Partial<UserWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.isTour = params.isTour || this.isTour;
            this.roleIds = Array.isArray(params.roleIds) ? params.roleIds : this.roleIds;
            this.profile = !!params.profile
                ? new UserProfileWithoutIds(params.profile)
                : this.profile;

            this.displayName = (!!params.profile
                ? new UserProfileWithoutIds(params.profile)
                : this.profile
            ).firstName;
            this.profileUrl = (!!params.profile
                ? new UserProfileWithoutIds(params.profile)
                : this.profile
            )?.url;
            this.settings = !!params.settings ? new UserSettings(params.settings) : this.settings;
            this.deviceInfo = Array.isArray(params.deviceInfo)
                ? params.deviceInfo.map(a => new UserDeviceInfo(a))
                : this.deviceInfo;
            this.horseRelationships = Array.isArray(params.horseRelationships)
                ? params.horseRelationships.map(r => new UserToHorseSummaryWithoutIds(r))
                : this.horseRelationships;
            this.billing = !!params.billing
                ? new UserBillingWithoutIds(params.billing)
                : this.billing;
            this.userNotificationSetting = !!params.userNotificationSetting
                ? new UserNotificationSetting(params.userNotificationSetting)
                : this.userNotificationSetting;
            this.followedHorses = Array.isArray(params.followedHorses)
                ? params.followedHorses.map(f => new HorseIdentityWithoutIds(f))
                : this.followedHorses;
        }
    }

    public toIdentity(): UserIdentityWithoutIds {
        return new UserIdentityWithoutIds({
            _id: this._id,
            label: `${this.profile.firstName} ${this.profile.lastName}`,
            picture: this.profile.profilePicture
        });
    }
}
