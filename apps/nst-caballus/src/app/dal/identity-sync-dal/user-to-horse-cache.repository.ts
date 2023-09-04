import { HorseIdentity, UserIdentity } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    MongoCollectionName,
    UpdateParams
} from '@rfx/nst-db/mongo';

@MongoCollectionName('userToHorseCache')
@Injectable()
export class UserToHorseCacheRepository extends MongoRepository {

    public async updateUserIdentities(userIdentity: UserIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'userIdentity._id' : userIdentity._id
        };

        const update = {
            userIdentity : userIdentity
        };

        this.update(update, updateParams);
    }

    public async updateHorseIdentities(horseIdentity: HorseIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'summaries.horseIdentity._id' : horseIdentity._id
        };

        const update = {
            $set: { 'summaries.$.horseIdentity' : horseIdentity }
        };

        this.updateBase(update, updateParams);
    }
}
