import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
    UpdateParams,
} from '@rfx/nst-db/mongo';
import { UserToHorseCache, UserToHorseSummary } from '@caballus/api-common';

@MongoCollectionName('userToHorseCache')
@Injectable()
export class UserToHorseCacheRepository extends MongoRepository {

    public async getUserToHorseCache(userId: ObjectId): Promise<UserToHorseCache> {
        const params = new FindParams({query: {
            'userIdentity._id' : userId
        }});
        return this.findOne(params);
    }

}
