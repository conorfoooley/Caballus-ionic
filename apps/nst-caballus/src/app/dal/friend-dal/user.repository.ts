import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
} from '@rfx/nst-db/mongo';
import {
    User
} from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('user')
@Injectable()
export class UserRepository extends MongoRepository {

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    @MapClass(User)
    public async getUserById(id: ObjectId): Promise<User> {
        const u = await this.findOneById<User>(id, new FindParams());
        return !!u ? new User(u) : u;
    }
}