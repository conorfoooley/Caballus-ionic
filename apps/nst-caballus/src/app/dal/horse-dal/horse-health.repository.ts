import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
    emptyStage,
    project,
    match,
} from '@rfx/nst-db/mongo';
import { SortDirection, Status } from '@rfx/common';
import { HorseHealth, HorseHealthSimple } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { pipe } from 'rxjs';
import { sort } from '@rfx/njs-db/mongo';

@MongoCollectionName('horseHealth')
@Injectable()
export class HorseHealthRepository extends MongoRepository {
    /**
     * Gets Horse Health by Id
     *
     * @param id
     * @returns The Horse health or null if not found
     */
    @MapClass(HorseHealth)
    public async getHorseHealthById(id: ObjectId): Promise<HorseHealth> {
        return this.findOneById<HorseHealth>(id, new FindParams());
    }

    /**
     * Create a Horse Health
     *
     * @param id
     * @returns The Horse health id
     */
    public async createHorseHealth(horseHealth: Partial<HorseHealth>): Promise<ObjectId> {
        return this.create(horseHealth);
    }

    /**
     * Update a Horse health
     *
     * @param id
     * @returns void
     */
    public async updateHorseHealth(id: ObjectId, update: Partial<HorseHealth>): Promise<void> {
        await this.updateById(id, update);
    }

    /**
     * Delete a Horse health
     *
     * @param id
     * @returns void
     */
    public async deleteHorseHealth(id: ObjectId): Promise<void> {
        await this.updateById(id, { status: Status.InActive });
    }

    /**
     * Get Horse health by horse id
     */
    public async getHorseHealthByHorseId(horseId: ObjectId): Promise<HorseHealthSimple[]> {
        const collection = await this.getCollection();
        const originalMatch = {
            'horseIdentity._id': horseId,
            status: Status.Active
        };
        const pipeline = pipe(
            match(originalMatch),
            emptyStage(
                {
                    $lookup: {
                        from: 'media',
                        let: { horseHealthId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [{ $eq: ['$collectionId', '$$horseHealthId'] }, { $eq: ['$status', Status.Active] }]
                                    }
                                }
                            },
                        ],
                        as: 'documents'
                    }
                },
            ),
            project({
                _id: 1,
                notes: 1,
                horseHealthType: 1,
                date: 1,
                documents: 1
            }),
            sort({ date: SortDirection.Descending })
        )([]);
        const aggCursor = await collection.aggregate<HorseHealthSimple>(pipeline);
        return await aggCursor.toArray();
    }
}
