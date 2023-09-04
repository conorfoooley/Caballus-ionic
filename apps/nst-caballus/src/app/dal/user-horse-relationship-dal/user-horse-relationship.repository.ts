import { Injectable } from '@nestjs/common';
import { MongoRepository, ObjectId, MongoCollectionName, FindParams } from '@rfx/nst-db/mongo';
import {
    UserHorseRelationship,
    UserHorseRelationshipStatus,
    UserIdentity
} from '@caballus/api-common';

@MongoCollectionName('userHorseRelationship')
@Injectable()
export class UserHorseRelationshipRepository extends MongoRepository {
    /**
     * Create a UserHorseRelationship
     *
     * @returns The horseRole id
     */
    public async createUserHorseRelationship(
        horseRole: Partial<UserHorseRelationship>
    ): Promise<ObjectId> {
        return this.create(horseRole);
    }

    /**
     * Update a UserHorseRelationship
     *
     * @returns void
     */
    public async updateUserHorseRelationship(
        id: ObjectId,
        update: Partial<UserHorseRelationship>
    ): Promise<void> {
        await this.updateById(id, update);
    }

    /**
     * Get UserHorseRelationship
     *
     * @returns UserHorseRelationship
     */
    public async getUserHorseRelationship(
        userId: ObjectId,
        horseId: ObjectId,
        status?: UserHorseRelationshipStatus
    ): Promise<UserHorseRelationship> {
        const params = new FindParams({
            query: {
                'userIdentity._id': userId,
                'horseIdentity._id': horseId
            }
        });

        if (!!status) {
            params.query['relationshipStatus'] = status;
        }

        return this.findOne(params);
    }

    /**
     * Get all user's UserHorseRelationships
     *
     * @returns UserHorseRelationship[]
     */
    public async getUserHorseRelationships(
        userId: ObjectId,
        horseIds: ObjectId[],
        status?: UserHorseRelationshipStatus
    ): Promise<UserHorseRelationship[]> {
        const params = new FindParams({
            query: {
                'userIdentity._id': userId,
                'horseIdentity._id': { $in: horseIds }
            }
        });

        if (!!status) {
            params.query['relationshipStatus'] = status;
        }

        params.getAllResults(true);

        const relationships = await this.find<UserHorseRelationship>(params);
        return relationships[0];
    }

    /**
     * Get HorseOwner
     *
     * @returns HorseOwner
     */
    public async getHorseOwner(
        horseId: ObjectId,
        status?: UserHorseRelationshipStatus
    ): Promise<UserIdentity> {
        const params = new FindParams({
            query: {
                'horseIdentity._id': horseId
            }
        });

        if (!!status) {
            params.query['relationshipStatus'] = status;
        }

        return this.findOne<UserHorseRelationship>(params).then(r => {
            return r.userIdentity;
        });
    }

    /**
     * Delete UserHorseRelationship
     *
     * @returns void
     */
    public async deleteUserHorseRelationship(id: ObjectId): Promise<void> {
        await this.deleteDocById(id);
    }
}
