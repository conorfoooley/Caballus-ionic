import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName
} from '@rfx/nst-db/mongo';
import { HorseCompetition, BaseMediaDocument } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { pipe } from 'rxjs';
import { objectIdMatch, sort, SortDirection, Status } from '@rfx/njs-db/mongo';

@MongoCollectionName('horseCompetition')
@Injectable()
export class HorseCompetitionRepository extends MongoRepository {
    /**
     * Gets Horse Competition by Id
     *
     * @param id
     * @returns The Horse competitions or null if not found
     */
    @MapClass(HorseCompetition)
    public async getHorseCompetitionByHorseId(horseId: ObjectId): Promise<HorseCompetition[]> {
        const params = new FindParams({
            query: {
                status: Status.Active
            },
        });
        params.query = pipe(
            objectIdMatch('horseIdentity._id', horseId)
        )(params.query);
        params.addSortFieldDescending('date');
        const res = await this.find<HorseCompetition>(params);
        return res[0];
    }

    /**
     * Create Horse competition by horse id
     * @param horseId
     * @param horseCompetition
     * @returns Created horse competition id
     */

    public saveHorseCompetition(horseCompetition: HorseCompetition): Promise<ObjectId> {
        return this.create(horseCompetition);
    }

    /**
     * Update Horse competition by competition id
     * @param id
     * @param horseCompetition
     * @returns void
     */

    public async updateHorseCompetitionById(id: ObjectId, horseCompetition: Partial<HorseCompetition>): Promise<void> {
        await this.updateById(new ObjectId(id), horseCompetition);
    }

    /**
     * Delete Horse competition by competition id
     */
    public async deleteHorseCompetitionById(id: ObjectId): Promise<void> {
        await this.updateById(new ObjectId(id), { status: Status.InActive });
    }

    public async updateHorseCompetitionPicture(id: ObjectId, image: BaseMediaDocument): Promise<void> {
        await this.updateById(id, {'image' : image});
    }

    public async deleteHorseCompetitionPicture(id: ObjectId): Promise<void> {
        await this.updateById(id, {'image' : null});
    }

}
