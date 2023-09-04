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

    public async createUserToHorseCache(c: Partial<UserToHorseCache>): Promise<ObjectId> {
        return this.create(c);
    }

    public async getUserToHorseCache(userId: ObjectId): Promise<UserToHorseCache> {
        const params = new FindParams({query: {
            'userIdentity._id' : userId
        }});
        return this.findOne(params);
    }

    public async updateUserToHorseCache(id: ObjectId, update: Partial<UserToHorseCache>): Promise<void> {
        await this.updateById(id, update);
    }

    public async addRelation(userId: ObjectId, summary: UserToHorseSummary): Promise<void> {
        const params = new UpdateParams();
        params.query = {
            'userIdentity._id' : userId
        };

        const update = {
            $push: { 'summaries' : summary }
        };

        await this.updateBase(update, params);
    }

    public async removeRelation(userId: ObjectId, horseToRemoveId: ObjectId): Promise<void> {
        const params = new UpdateParams();
        params.query = {
            'userIdentity._id' : userId
        };

        const update = {
            $pull: { summaries: { horseIdentity: { _id : horseToRemoveId } } }
        };

        await this.updateBase(update, params);
    }

}
