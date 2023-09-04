import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    MongoCollectionName,
    ObjectId,
} from '@rfx/nst-db/mongo';
import { User } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';

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

}
