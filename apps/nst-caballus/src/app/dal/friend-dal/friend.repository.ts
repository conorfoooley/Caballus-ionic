import { Friend, FriendStatus } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import { Status } from '@rfx/common';
import {
    FindParams,
    match,
    MongoCollectionName,
    MongoRepository,
    numberGreaterThan,
    numberMatch,
    ObjectId,
    objectIdMatch,
    UpdateParams
} from '@rfx/nst-db/mongo';
import { pipe } from 'rxjs';

@MongoCollectionName('friend')
@Injectable()
export class FriendRepository extends MongoRepository {
    public async getAllFriends(userId: ObjectId): Promise<Friend[]> {
        const params = new FindParams({
            query: {
                status: Status.Active,
                uniqueIdentifier: new RegExp(`${userId.toString()}`)
            }
        });
        params.getAllResults(true);
        const result = await this.find<Friend>(params);
        return result[0];
    }

    public async updateFriend(
        id: ObjectId,
        update: Partial<Friend>,
        userId: ObjectId
    ): Promise<void> {
        const params = new UpdateParams();
        params.query = pipe(objectIdMatch('friendIdentity._id', userId));
        update.uniqueIdentifier =  `${update.friendIdentity._id.toString()}_${update.userIdentity._id.toString()}`
        this.updateById(id, update, params);
    }

    public async getFriendById(id: ObjectId): Promise<Friend> {
        return this.findOneById(id, new FindParams());
    }

    public async getFriendShipDetails(userId: ObjectId, friendId: ObjectId): Promise<Friend> {
        const params = new FindParams();
        params.query = {
            status: Status.Active,
            $or: [{ uniqueIdentifier: `${userId.toString()}_${friendId.toString()}`}, {uniqueIdentifier : `${friendId.toString()}_${userId.toString()}`}]
        };
        return this.findOne(params);
    }

    public async getFriendsByUserId(userId: ObjectId): Promise<Friend[]> {
        const params = new FindParams();
        params.query = {
            status: Status.Active,
            uniqueIdentifier: {$regex: userId.toString(), $options: 'i'},
            friendStatus: FriendStatus.Friends
        };
        params.getAllResults(true);
        console.log(params)
        const friends = await this.find<Friend[]>(params);
        return friends[0] as any
    }
    public async createFriend(friend: Partial<Friend>): Promise<ObjectId> {
        friend.uniqueIdentifier =  `${friend.friendIdentity._id.toString()}_${friend.userIdentity._id.toString()}`
        return this.create(friend);
    }

    public async removeFriend(id: ObjectId): Promise<void> {
        this.updateById(id, { status: Status.InActive });
    }

    public async removeAllFriend(): Promise<void> {
        // this.deleteDoc(new UpdateParams(true));
    }
}
