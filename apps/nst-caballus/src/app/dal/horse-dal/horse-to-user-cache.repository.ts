import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
    UpdateParams,
} from '@rfx/nst-db/mongo';
import { HorseToUserCache, HorseToUserSummary } from '@caballus/api-common';

@MongoCollectionName('horseToUserCache')
@Injectable()
export class HorseToUserCacheRepository extends MongoRepository {

    public async createHorseToUserCache(c: Partial<HorseToUserCache>): Promise<ObjectId> {
        return this.create(c);
    }

    public async getHorseToUserCache(horseId: ObjectId): Promise<HorseToUserCache> {
        const params = new FindParams({query: {
            'horseIdentity._id' : horseId
        }});
        return this.findOne(params);
    }

    public async getHorseToUserCacheByHorseIdList(horseIds: ObjectId[]): Promise<HorseToUserCache[]> {
        const params = new FindParams({query: {
            'horseIdentity._id' : { $in: horseIds }
        }});
        params.getAllResults(true);
        return (await this.find<HorseToUserCache>(params))[0];
    }

    public async updateHorseToUserCache(id: ObjectId, update: Partial<HorseToUserCache>): Promise<void> {
        await this.updateById(id, update);
    }

    public async addRelation(horseId: ObjectId, summary: HorseToUserSummary): Promise<void> {
        const params = new UpdateParams();
        params.query = {
            'horseIdentity._id' : horseId
        };

        const update = {
            $push: { 'summaries' : summary }
        };

        await this.updateBase(update, params);
    }

    public async removeRelation(horseId: ObjectId, userToRemoveId: ObjectId): Promise<void> {
        const params = new UpdateParams();
        params.query = {
            'horseIdentity._id' : horseId
        };

        const update = {
            $pull: { summaries: { userIdentity: { _id : userToRemoveId } } }
        };

        await this.updateBase(update, params);
    }

}
