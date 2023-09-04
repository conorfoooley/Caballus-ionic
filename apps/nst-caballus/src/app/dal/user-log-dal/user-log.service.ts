import { Injectable } from '@nestjs/common';
import {
    UserDeviceInfo
} from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { UserRepository } from './user.repository';
import { UserAppInfo } from '@caballus/api-common';

@Injectable()
export class UserLogService {
    constructor(
        private readonly _userRepo: UserRepository
    ) { }

    /**
     * Save user login environment info with log time
     *
     * @param userId
     * @param deviceInfo
    */
    public async saveUserLoginEnvInfo(userId: ObjectId, deviceInfo: Partial<UserDeviceInfo>): Promise<void> {
        const user = await this._userRepo.getUserById(userId);
        const appInfo = new UserAppInfo({
            loginAt: new Date(),
            appVersion: deviceInfo.appInfo[0].appVersion
        });
        const exitingDeviceInfo = user.deviceInfo && user.deviceInfo.find(({
            deviceId
        }) => deviceId === deviceInfo.deviceId);
        if (exitingDeviceInfo) {
            await this._userRepo.updateExistingUserEnvInfo(userId, deviceInfo.deviceId, appInfo);
        } else {
            await this._userRepo.saveNewUserEnvInfo(userId, new UserDeviceInfo({
                ...deviceInfo,
                appInfo: [appInfo]
            }));
        }
    }
}
