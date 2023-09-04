import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
} from '@rfx/nst-db/mongo';
import { User } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('user')
@Injectable()
export class UserRepository extends MongoRepository {

    @MapClass(User)
    public async getUserById(id: ObjectId): Promise<User> {
        return this.findOneById<User>(id, new FindParams());
    }

}
