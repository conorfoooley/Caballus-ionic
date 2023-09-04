import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
} from '@rfx/nst-db/mongo';
import { HorseRole } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('horseRole')
@Injectable()
export class HorseRoleRepository extends MongoRepository {
    /**
     * Gets an active horseRole by their id
     *
     * @param id
     * @returns The horseRole or null if not found
     */
    @MapClass(HorseRole)
    public async getHorseRoleById(id: ObjectId): Promise<HorseRole> {
        return this.findOneById<HorseRole>(id, new FindParams());
    }

    /**
     * Create a HorseRole
     *
     * @returns The horseRole id
     */
    public async createHorseRole(horseRole: Partial<HorseRole>): Promise<ObjectId> {
        return this.create(horseRole);
    }

    /**
     * Update a HorseRole
     *
     * @param id
     * @returns void
     */
    public async updateHorseRole(id: ObjectId, update: Partial<HorseRole>): Promise<void> {
        await this.updateById(id, update);
    }

    /**
     * Get all HorseRoles
     *
     * @returns void
     */
    @MapClass(HorseRole)
    public async getHorseRoles(includeOwner: boolean): Promise<HorseRole[]> {
        const findParams = new FindParams();
        findParams.getAllResults(true);

        if (!includeOwner) {
            findParams.query = {name : { $ne: 'Owner' }};
        }
        const res = await this.find<HorseRole>(findParams);
        return res[0];
    }

    /**
     * Gets the default role given to the creator of a horse
     *
     * @param id
     * @returns The horseRole or null if not found
     */
    @MapClass(HorseRole)
    public async getDefaultCreatorRole(): Promise<HorseRole> {
        return this.findOne<HorseRole>(new FindParams({query: {
            name: 'Owner'
        }}));
    }

    @MapClass(HorseRole)
    public async getOwnerRole(): Promise<HorseRole> {
        return this.findOne<HorseRole>(new FindParams({query: {
            name: 'Owner'
        }}));
    }

    @MapClass(HorseRole)
    public async getStudentRole(): Promise<HorseRole> {
        return this.findOne<HorseRole>(new FindParams({query: {
            name: 'Student'
        }}));
    }

    @MapClass(HorseRole)
    public async getTrainerRole(): Promise<HorseRole> {
        return this.findOne<HorseRole>(new FindParams({query: {
            name: 'Trainer'
        }}));
    }

}
