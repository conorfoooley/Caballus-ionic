import { Injectable, NotFoundException } from '@nestjs/common';
import {
  HorseEvaluation,
  HorseEvaluationSimple,
  HorseMatrix,
  HorseMatrixSimple,
  HorseMatrixType,
  MediaCollectionName,
  MediaDocumentType,
  UploadedFileObject,
} from '@caballus/api-common';
import { HorseEvaluationRepository } from './horse-evaluation.repository';
import { ObjectId } from '@rfx/njs-db/mongo';
import { HorseRepository } from './horse.repository';
import { HorseEvaluationMatrixRepository } from './horse-evaluation-matrix.repository';
import { UserRepository } from './user.repository';
import { MediaService } from '../media-dal/media.service';

@Injectable()
export class HorseEvaluationService {
  constructor(
    private readonly _horseEvaluationRepository: HorseEvaluationRepository,
    private readonly _horseEvaluationMatrixRepository: HorseEvaluationMatrixRepository,
    private readonly _horseRepo: HorseRepository,
    private readonly _userRepo: UserRepository,
    private readonly _mediaService: MediaService
  ) {}

  /**
   * Get horse evaluation by horse id
   *
   * @param horseId
   */
  public async getHorseEvaluationByHorseId(
    horseId: ObjectId
  ): Promise<HorseEvaluationSimple[]> {
    const horseEvaluations =
      await this._horseEvaluationRepository.getHorseEvaluationByHorseId(
        horseId
      );
    return horseEvaluations;
  }

  /**
   * Get horse evaluation matrix by evaluation id
   *
   * @param evaluationId
   * @param horseId
   */
  public async getHorseEvaluationMatrixByEvaluationId(
    evaluationId: ObjectId,
    horseId: ObjectId
  ): Promise<HorseMatrixSimple[]> {
    const horseEvaluationMatrixes =
      await this._horseEvaluationMatrixRepository.getHorseEvaluationMatrixByEvaluationId(
        evaluationId,
        horseId
      );
    for (const h of horseEvaluationMatrixes) {
      if (h?.documents?.length) {
        for (const document of h.documents) {
          if (document.latest.path) {
            document.latest.url = await this._mediaService.getSignedUrl(
              document.latest.path
            );
          }
        }
      }
    }
    return horseEvaluationMatrixes;
  }

  /**
   * Create Horse evaluation by horse id
   * @param horseId
   * @param evaluationDto
   * @returns Created Horse evaluation id
   */
  public async saveHorseEvaluation(
    horseId: ObjectId,
    evaluationDto: Partial<HorseEvaluation>
  ): Promise<ObjectId> {
    const horse = await this._horseRepo.getHorseById(horseId);
    if (!horse) {
      throw new NotFoundException('Horse not found');
    }
    const evaluation: HorseEvaluation = new HorseEvaluation({
      ...evaluationDto,
      horseIdentity: horse.toIdentity(),
    });
    const horseEvaluationId =
      await this._horseEvaluationRepository.saveHorseEvaluation(evaluation);
    return horseEvaluationId;
  }

  /**
   * Update Horse evaluation by evaluation id
   * @param id
   * @param evaluationDto
   * @returns void
   */
  public async updateHorseEvaluationById(
    id: ObjectId,
    evaluationDto: Partial<HorseEvaluation>
  ): Promise<void> {
    await this._horseEvaluationRepository.updateHorseEvaluationById(
      id,
      evaluationDto
    );
  }

  /**
   * Delete Horse evaluation by evaluation id
   * @param id
   * @returns void
   */
  public async deleteHorseEvaluationById(id: ObjectId): Promise<void> {
    await this._horseEvaluationRepository.deleteHorseEvaluationById(id);
    await this._horseEvaluationMatrixRepository.deleteHorseEvaluationMatrixByEvaluationId(
      id
    );
  }

  public deleteHorseMatrixById(id: ObjectId): Promise<void> {
    return this._horseEvaluationMatrixRepository.deleteHorseEvaluationMatrixById(
      id
    );
  }

  /**
   *
   */
  public async createUpdateHorseEvaluationMatrix(
    lUser,
    {
      horseId,
      notes,
      rating,
      horseMatrixType,
      evaluationId,
      horseMatrixGroupTitle,
    }: {
      horseId: ObjectId;
      notes: string;
      rating: number;
      horseMatrixType: HorseMatrixType | string;
      evaluationId: ObjectId;
      horseMatrixGroupTitle?: string;
    },
    files: UploadedFileObject[]
  ): Promise<ObjectId> {
    let horseEvaluationMatrixId;
    const horse = await this._horseRepo.getHorseById(horseId);
    if (!horse) {
      throw new NotFoundException(`Horse profile not found`);
    }
    let horseEvaluationMatrix =
      await this._horseEvaluationMatrixRepository.getHorseEvaluationMatrixByEvaluationByType(
        evaluationId,
        horseMatrixType
      );
    if (horseEvaluationMatrix) {
      await this._horseEvaluationMatrixRepository.updateHorseEvaluationMatrixById(
        horseEvaluationMatrix._id,
        {
          rating: rating ? Number(rating) : rating,
          notes,
          horseMatrixGroupTitle,
        }
      );
      horseEvaluationMatrixId = horseEvaluationMatrix._id;
    } else {
      horseEvaluationMatrix = new HorseMatrix({
        notes,
        rating,
        horseMatrixType,
        horseIdentity: horse.toIdentity(),
        evaluationId,
        horseMatrixGroupTitle,
      });
      horseEvaluationMatrixId =
        await this._horseEvaluationMatrixRepository.saveHorseEvaluationMatrix(
          horseEvaluationMatrix
        );
    }
    const user = await this._userRepo.findUserById(lUser._id);
    if (files?.length) {
      await Promise.all(
        files.map((file) =>
          this._mediaService.createMedia(
            null,
            MediaCollectionName.HorseEvaluationMatrix,
            horseEvaluationMatrixId,
            MediaDocumentType.Document,
            file,
            user.toIdentity()
          )
        )
      );
    }
    return horseEvaluationMatrix._id;
  }
}
