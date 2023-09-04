import { Injectable } from '@nestjs/common';
import {
  MongoRepository,
  FindParams,
  ObjectId,
  MongoCollectionName,
  UpdateParams
} from '@rfx/nst-db/mongo';
import { HorseMatrix, HorseMatrixSimple } from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { pipe } from 'rxjs';
import { emptyStage, match, objectIdMatch, project, Status } from '@rfx/njs-db/mongo';

@MongoCollectionName('horseEvaluationMatrix')
@Injectable()
export class HorseEvaluationMatrixRepository extends MongoRepository {
  /**
   * Gets Horse Evaluation by Id
   *
   * @param id
   * @returns The Horse evaluations or null if not found
   */
  @MapClass(HorseMatrix)
  public async getHorseEvaluationMatrixByEvaluationByType(evaluationId: ObjectId, horseMatrixType): Promise<HorseMatrix> {
    const params = new FindParams({
      query: {
        status: Status.Active,
        horseMatrixType
      }
    });
    params.query = pipe(
      objectIdMatch('evaluationId', evaluationId)
    )(params.query);
    return this.findOne<HorseMatrix>(params);
  }

  /**
   * Gets Horse Evaluation by Id
   *
   * @param id
   * @returns The Horse evaluations or null if not found
   */
  public async getHorseEvaluationMatrixByEvaluationId(evaluationId: ObjectId, horseId: ObjectId): Promise<HorseMatrixSimple[]> {
    const collection = await this.getCollection();
    const originalMatch = {
      'horseIdentity._id': horseId,
      status: Status.Active,
      evaluationId
    };
    const pipeline = pipe(
      match(originalMatch),
      emptyStage(
        {
          $lookup: {
            from: 'media',
            let: { evaluationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$collectionId', '$$evaluationId'] }, { $eq: ['$status', Status.Active] }]
                  }
                }
              }
            ],
            as: 'documents'
          }
        }
      ),
      project({
        _id: 1,
        notes: 1,
        horseMatrixType: 1,
        rating: 1,
        documents: 1,
        evaluationId: 1,
        horseIdentity: 1,
        horseMatrixGroupTitle: 1
      })
    )([]);
    const aggCursor = await collection.aggregate<HorseMatrixSimple>(pipeline);
    return await aggCursor.toArray();
  }

  /**
   * Create Horse evaluation matrix by horse evaluation id
   * @param horseId
   * @param horseMatrix
   * @returns Created horse evaluation matrix id
   */

  public saveHorseEvaluationMatrix(horseMatrix: HorseMatrix): Promise<ObjectId> {
    return this.create(horseMatrix);
  }

  /**
   * Update Horse evaluation by horse evaluation matrix id
   * @param id
   * @param horseMatrix
   * @returns void
   */

  public async updateHorseEvaluationMatrixById(id: ObjectId, horseMatrix: Partial<HorseMatrix>): Promise<void> {
    await this.updateById(new ObjectId(id), horseMatrix);
  }

  /**
   * Delete Horse evaluation by evaluation id
   */
  public async deleteHorseEvaluationMatrixByEvaluationId(evaluationId: ObjectId): Promise<void> {
    const params = new UpdateParams();
    params.query = {
      evaluationId: new ObjectId(evaluationId)
    };
    const update = {
      status: Status.InActive
    };
    await this.update(update, params);
  }

  public async deleteHorseEvaluationMatrixById(id: ObjectId): Promise<void> {
    await this.updateById(new ObjectId(id), { status: Status.InActive });
  }
}
