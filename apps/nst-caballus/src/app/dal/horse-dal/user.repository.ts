import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    MongoCollectionName,
    ObjectId,
    UpdateParams
} from '@rfx/nst-db/mongo';
import { Horse, User } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { HorseIdentity } from '@caballus/api-common';

@MongoCollectionName('user')
@Injectable()
export class UserRepository extends MongoRepository {

    public async findUsersByIdList(ids: ObjectId[]): Promise<User[]> {
        return (await this.findByIdList<User>(ids, new FindParams()))[0];
    }

    @MapClass(User)
    public async findUserById(id: ObjectId): Promise<User> {
        return this.findOneById<User>(id, new FindParams());
    }

    public async followUnfollowHorseByUserId(id: ObjectId, horse: HorseIdentity): Promise<HorseIdentity[]> {
        const user = await this.findUserById(id);
        const hasFollowed = user.followedHorses?.findIndex(
            ({ _id }) => _id.toString() === horse._id.toString()
        );
        if (hasFollowed > -1) {
            user.followedHorses.splice(hasFollowed, 1);
        } else {
            if (!user.followedHorses) {
                user.followedHorses = [];
            }
            user.followedHorses.push(horse);
        }
        const params = new UpdateParams(false);
        const update = {
            followedHorses: user.followedHorses
        };
        await this.updateById(id, update, params);
        return user.followedHorses;
    }

    public async isHorseFollowed(id: ObjectId, horseId: ObjectId): Promise<boolean> {
        const user = await this.findUserById(id);
        const hasFollowed = user.followedHorses?.findIndex(
            ({ _id }) => _id.toString() === horseId.toString()
        );
        return hasFollowed > -1;
    }



    public async getFollowedUsersByHorseId(horseId: ObjectId): Promise<User[]> {
        const findParams = new FindParams();
        findParams.query = {
            followedHorses: {$elemMatch: { _id: horseId}}
        }
        findParams.getAllResults(true); 
        const res = await this.find<User>(findParams);
        return res[0];
    }
}
