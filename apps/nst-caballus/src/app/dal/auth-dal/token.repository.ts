import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    MongoCollectionName,
    ObjectId
} from '@rfx/nst-db/mongo';

interface Token {
    _id?: ObjectId;
    userId: ObjectId;
    absoluteUserId?: ObjectId;
    expireDate?: Date;
}

@MongoCollectionName('token')
@Injectable()
export class TokenRepository extends MongoRepository {
    /**
     * Inserts a token
     * The expireDate is used as a TTL and will be automatically removed from db
     * Expire date left as optional in the event expiring tokens are needed later
     *
     * @param user
     * @returns The id of the newly inserted token
     */
    public async createToken(userId: ObjectId, expireDate?: Date, absoluteUserId?: ObjectId): Promise<ObjectId> {
        const token: Token = { userId: userId };
        if (absoluteUserId) {
            token.absoluteUserId = absoluteUserId;
        }
        if (expireDate) {
            token.expireDate = expireDate;
        }
        return this.create(token);
    }

    /**
     * Check database for an existing refresh token
     *
     * @param userId
     * @param absoluteUserId
     * @returns Token object
     */
    public async getTokenForUser(userId: ObjectId, absoluteUserId?: ObjectId): Promise<Token> {
        const params = new FindParams({ query: { userId: userId } });
        if (absoluteUserId) {
            params.query.absoluteUserId = absoluteUserId;
        }
        return this.findOne<Token>(params);
    }

    /**
     * Checks to see if the token document exists.
     *
     * @param id ObjectId
     * @param userId ObjectId
     * @returns boolean
     */
    public async isTokenActive(id: ObjectId, userId: ObjectId, absoluteUserId?: ObjectId): Promise<boolean> {
        const params = new FindParams({ query: { userId: userId } });
        if (!!absoluteUserId) {
            params.query.absoluteUserId = absoluteUserId;
        }
        const token = await this.findOneById(id, params);
        // if the token is found, it has not expired
        return token !== null;
    }
}
