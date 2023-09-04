import { Injectable, NotFoundException } from '@nestjs/common';
import {
    User,
    HorseCompetition,
    HorseCompetitionSimple,
    MediaCollectionName,
    MediaDocumentType,
    UploadedFileObject
} from '@caballus/api-common';
import { HorseCompetitionRepository } from './horse-competition.repository';
import { ObjectId } from '@rfx/njs-db/mongo';
import { HorseRepository } from './horse.repository';
import { UserRepository } from './user.repository';
import { MediaService } from '../media-dal/media.service';

@Injectable()
export class HorseCompetitionService {
    constructor(
        private readonly _horseCompetitionRepository: HorseCompetitionRepository,
        private readonly _horseRepo: HorseRepository,
        private readonly _userRepo: UserRepository,
        private readonly _mediaService: MediaService
    ) { }

    /**
     * Get horse competition by horse id
     *
     * @param horseId
    */
    public async getHorseCompetitionByHorseId(horseId: ObjectId): Promise<HorseCompetitionSimple[]> {
        const horseCompetitions = await this._horseCompetitionRepository.getHorseCompetitionByHorseId(horseId);
        return horseCompetitions;
    }
    /**
     * Create Horse competition by horse id
     * @param horseId
     * @param competitionDto
     * @returns Created Horse competition id
     */
    public async saveHorseCompetition(horseId: ObjectId, competitionDto: Partial<HorseCompetition>): Promise<ObjectId> {
        const horse = await this._horseRepo.getHorseById(horseId);
        if (!horse) {
            throw new NotFoundException('Horse not found');
        }
        const competition: HorseCompetition = new HorseCompetition({
            ...competitionDto,
            horseIdentity: horse.toIdentity()
        });
        const horseComeptitionId = await this._horseCompetitionRepository.saveHorseCompetition(competition);
        return horseComeptitionId;
    }

    /**
     * Update Horse competition by competition id
     * @param id
     * @param competitionDto
     * @returns void
     */
    public async updateHorseCompetitionById(id: ObjectId, competitionDto: Partial<HorseCompetition>): Promise<void> {
        await this._horseCompetitionRepository.updateHorseCompetitionById(id, competitionDto);
    }

    /**
     * Delete Horse competition by competition id
     * @param id
     * @returns void
     */
    public async deleteHorseCompetitionById(id: ObjectId): Promise<void> {
        await this._horseCompetitionRepository.deleteHorseCompetitionById(id);
    }

      /**
     * Delete Horse competition image by competition id
     * @param id
     * @returns void
     */
    public async deleteHorseCompetitionPictureById(id: ObjectId): Promise<void> {
        await this._horseCompetitionRepository.deleteHorseCompetitionPicture(id)
    }

    public async editCompetitionPicture(
        lUser: User,
        competitionId: ObjectId,
        image: UploadedFileObject
    ): Promise<void> {
        const user = await this._userRepo.findUserById(new ObjectId(lUser._id));

        const baseMedia = await this._mediaService.createMedia(
            null,
            MediaCollectionName.HorseCompetition,
            competitionId,
            MediaDocumentType.Image,
            image,
            user.toIdentity()
        );
        const signedUrl = await this._mediaService.getSignedUrl(baseMedia.path);
        await this._horseCompetitionRepository.updateHorseCompetitionPicture(
            competitionId,
            {...baseMedia, url: signedUrl}
        );
    }
}
