import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName
} from '@rfx/nst-db/mongo';
import { HorseEvaluation } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { pipe } from 'rxjs';
import { objectIdMatch, sort, SortDirection, Status } from '@rfx/njs-db/mongo';

@MongoCollectionName('horseEvaluation')
@Injectable()
export class HorseEvaluationRepository extends MongoRepository {
    /**
     * Gets Horse Evaluation by Id
     *
     * @param id
     * @returns The Horse evaluations or null if not found
     */
    @MapClass(HorseEvaluation)
    public async getHorseEvaluationByHorseId(horseId: ObjectId): Promise<HorseEvaluation[]> {
        const params = new FindParams({
            query: {
                status: Status.Active
            },
        });
        params.query = pipe(
            objectIdMatch('horseIdentity._id', horseId)
        )(params.query);
        params.addSortFieldDescending('date');
        const res = await this.find<HorseEvaluation>(params);
        return res[0];
    }

    /**
     * Create Horse evaluation by horse id
     * @param horseId
     * @param horseEvaluation
     * @returns Created horse evaluation id
     */

    public saveHorseEvaluation(horseEvaluation: HorseEvaluation): Promise<ObjectId> {
        return this.create(horseEvaluation);
    }

    /**
     * Update Horse evaluation by evaluation id
     * @param id
     * @param horseEvaluation
     * @returns void
     */

    public async updateHorseEvaluationById(id: ObjectId, horseEvaluation: Partial<HorseEvaluation>): Promise<void> {
        await this.updateById(new ObjectId(id), horseEvaluation);
    }

    /**
     * Delete Horse evaluation by evaluation id
     */
    public async deleteHorseEvaluationById(id: ObjectId): Promise<void> {
        await this.updateById(new ObjectId(id), { status: Status.InActive });
    }
}
