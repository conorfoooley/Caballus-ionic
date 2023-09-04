import { HorseIdentity, UserIdentity } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    MongoCollectionName,
    UpdateParams
} from '@rfx/nst-db/mongo';

@MongoCollectionName('horseToUserCache')
@Injectable()
export class HorseToUserCacheRepository extends MongoRepository {

    public async updateUserIdentities(userIdentity: UserIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'summaries.userIdentity._id' : userIdentity._id
        };

        const update = {
            $set: { 'summaries.$.userIdentity' : userIdentity }
        };

        this.updateBase(update, updateParams);
    }

    public async updateHorseIdentities(horseIdentity: HorseIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'horseIdentity._id' : horseIdentity._id
        };

        const update = {
            horseIdentity : horseIdentity
        };

        this.update(update, updateParams);
    }
}
