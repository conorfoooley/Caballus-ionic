import { Injectable } from '@nestjs/common';
import { FindParams, MongoCollectionName, MongoRepository, ObjectId, UpdateParams, } from '@rfx/nst-db/mongo';
import { FullUser, Horse, HorseIdentity, User } from '@caballus/api-common';
import { Status } from '@rfx/common';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('user')
@Injectable()
export class UserRepository extends MongoRepository {
    /**
     * Gets an active user by their email address.
     *
     * Make sure the `status` field is included on the database index.
     *
     * @param email
     * @returns The user or null if not found
     */
    @MapClass(User)
    public async getUserByEmail(email: string): Promise<User> {
        const params = new FindParams({query: {'profile.email': email, status: Status.Active}});
        return this.findOne<FullUser>(params);
    }

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    @MapClass(User)
    public async getUserById(id: ObjectId): Promise<User> {
        return this.findOneById<User>(id, new FindParams());
    }

    public async getUsersByIdList(ids: ObjectId[]): Promise<User[]> {
        const params = new FindParams();
        params.getAllResults(true);
        const res = await this.findByIdList<User>(ids, params);
        return res[0];
    }

    public async followHorseByUserId(user: User, horse: HorseIdentity): Promise<void> {
        const hasFollowed = user.followedHorses?.findIndex(
            ({ _id }) => _id.toString() === horse._id.toString()
        );
        if (hasFollowed === -1) {
            if (!user.followedHorses) {
                user.followedHorses = [];
            }
            user.followedHorses.push(horse);
        } 
        const params = new UpdateParams(false);
        const update = {
            followedHorses: user.followedHorses
        };
        await this.updateById(user._id, update, params);
    }

}
