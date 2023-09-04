import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
} from '@rfx/nst-db/mongo';
import { Horse } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('horse')
@Injectable()
export class HorseRepository extends MongoRepository {
    /**
     * Gets an active horse by their id
     *
     * @param id
     * @returns The horse or null if not found
     */
    @MapClass(Horse)
    public async getHorseById(id: ObjectId): Promise<Horse> {
        return this.findOneById<Horse>(id, new FindParams());
    }

    @MapClass(Horse)
    public async getHorsesByIdList(ids: ObjectId[]): Promise<Horse[]> {
        return (await this.findByIdList<Horse>(ids, new FindParams()))[0];
    }

    public async updateHorseEndDateTime(horseIds: ObjectId[], endDateTime: Date): Promise<void> {
        for (const id of horseIds) {
            await this.updateById(id, {
                'profile.endDateTime': endDateTime
            });
        }
    }
}
