import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
    match,
    project,
    group,
    emptyStage
} from '@rfx/nst-db/mongo';
import { limit, skip, sort, UpdateParams } from '@rfx/njs-db/mongo';
import { Ride, RideCategory, RideStatus } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { pipe } from 'rxjs';
import { PaginatedList, SortDirection, Status } from '@rfx/common';

@MongoCollectionName('ride')
@Injectable()
export class RideRepository extends MongoRepository {
    /**
     * Gets an active ride by their id
     *
     * @param id
     * @returns The ride or null if not found
     */
    @MapClass(Ride)
    public async getRideById(id: ObjectId): Promise<Ride> {
        return this.findOneById<Ride>(id, new FindParams());
    }

    @MapClass(Ride)
    public async getFinalRide(userId: ObjectId): Promise<Ride> {
        // const collection = await this.getCollection();
        const findParams = new FindParams();
        findParams.getAllResults(true);
        findParams.query = {
            'riderIdentity._id': userId,
            paths: { $exists: true, $type: 'array', $ne: [] }
        };
        findParams.addSortFieldDescending('startDateTime');

        // const res = await collection.find<Ride[]>({ $where: 'this.path.length > 0' });
        const res = await this.findOne<Ride>(findParams);
        return res;
    }

    /**
     * Create a Ride
     *
     * @param id
     * @returns The ride id
     */
    public async createRide(ride: Partial<Ride>): Promise<ObjectId> {
        return this.create(ride);
    }

    /**
     * Update a Ride
     *
     * @param id
     * @returns void
     */
    public async updateRide(id: ObjectId, update: Partial<Ride>): Promise<void> {
        await this.updateById(id, update);
    }

    /**
     * Delete a Ride
     *
     * @param id
     * @returns void
     */
    public async deleteRide(id: ObjectId): Promise<void> {
        await this.updateById(id, { status: Status.InActive });
    }

    public async realDeleteRide(id: ObjectId): Promise<void> {
        await this.deleteDocHardById(id);
    }

    public async finishRide(id: ObjectId, update: {
        endDateTime: Date | null,
        rideStatus: RideStatus,
        category: RideCategory
    }): Promise<void> {
        const params = new UpdateParams(false);
        await this.updateById(id, update, params)
    }
}
