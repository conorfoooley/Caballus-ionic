import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
    UpdateParams,
} from '@rfx/nst-db/mongo';
import { User, UserAppInfo, UserDeviceInfo } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('user')
@Injectable()
export class UserRepository extends MongoRepository {

    /**
     * Get user information by user id
     * @param id
     * @returns user information
     */
    @MapClass(User)
    public async getUserById(id: ObjectId): Promise<User> {
        return this.findOneById<User>(id, new FindParams());
    }

    /**
     * Log user login environment info with log time with app version
     * @param id
     * @param deviceInfo
     */
    public async saveNewUserEnvInfo(id: ObjectId, deviceInfo: UserDeviceInfo): Promise<void> {
        const params = new UpdateParams(false);
        params.query = {
            _id: id
        };
        await this.updateBase({
            $push: {
                deviceInfo
            }
        }, params);
    }

    /**
     * Log user login log time with app version
     * @param id
     * @param deviceId
     * @param appInfo
     */
    public async updateExistingUserEnvInfo(id: ObjectId, deviceId: string, appInfo: UserAppInfo): Promise<void> {
        const params = new UpdateParams(false);
        params.query = {
            _id: id,
            'deviceInfo.deviceId': deviceId
        };
        await this.updateBase({
            $push: {
                'deviceInfo.$.appInfo': appInfo
            }
        }, params);
    }
}
