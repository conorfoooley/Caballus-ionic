import {
    Controller,
    Param,
    Get,
    Post,
    Body,
    Put,
    Delete,
    Query,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { HorseCompetitionService, HorseService } from '@nst-caballus/dal';
import { LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import { ApiOperation, ApiBearerAuth, ApiTags, ApiConsumes,  } from '@nestjs/swagger';
import {
    User,
    HorsePermission,
    HorseCompetitionSimple,
    UploadedFileObject,
} from '@caballus/api-common';
import { IdDto, ObjectId } from '@rfx/nst-db/mongo';
import { HorseCompetitionDto } from './dto/horse-competition.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('competitions')
@Controller('competitions')
export class HorseCompetitionController {
    constructor(
        private readonly _horseService: HorseService,
        private readonly _horseCompetitionService: HorseCompetitionService
    ) { }


    @Get(':id/list')
    @ApiOperation({ summary: 'Get all competitions by horse id' })
    @Secured(WildCardPermission)
    public async getHorseCompetitionList(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseCompetitionSimple[]> {
        await this._horseService.checkUserHasHorsePermission(user._id, [idDto.id], HorsePermission.HorseView);
        return this._horseCompetitionService.getHorseCompetitionByHorseId(idDto.id);
    }

    @Post(':id')
    @ApiOperation({ summary: 'Save competitions by horse id' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')

    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 20000000 } }))
    public async saveHorseCompetition(
        @Param() horseId: IdDto,
        @LoggedInUser() user: User,
        @Body() dto: HorseCompetitionDto,
        @UploadedFile() image: UploadedFileObject
    ): Promise<ObjectId> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [horseId.id],
            HorsePermission.HorseEdit
        );
        const horseComeptitionId = await this._horseCompetitionService.saveHorseCompetition(
            horseId.id,
            dto
        );
        if (image) {
            await this._horseCompetitionService.editCompetitionPicture(
                user,
                horseComeptitionId,
                image
            );
        }
        return horseComeptitionId;
    }

    @Put(':horseId/:competitionId')
    @ApiOperation({ summary: 'Save competitions by competition id' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')

    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 20000000 } }))
    public async updateHorseCompetitionById(
        @Param('competitionId') competitionId: ObjectId,
        @Param('horseId') horseId: ObjectId,
        @LoggedInUser() user: User,
        @Body() dto: HorseCompetitionDto,
        @UploadedFile() image?: UploadedFileObject
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId], HorsePermission.HorseEdit);
        if (image) {
            await this._horseCompetitionService.editCompetitionPicture(
                user,
                competitionId,
                image
            );
        }
        return this._horseCompetitionService.updateHorseCompetitionById(competitionId, dto);
    }

    @Delete(':horseId/:competitionId')
    @ApiOperation({ summary: 'Delete competitions by id' })
    @Secured(WildCardPermission)
    public async deleteHorsecompetitionById(
        @Param('competitionId') competitionId: ObjectId,
        @Param('horseId') horseId: ObjectId,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId], HorsePermission.HorseEdit);
        return this._horseCompetitionService.deleteHorseCompetitionById(competitionId);
    }

    @Delete(':horseId/:competitionId/image')
    @ApiOperation({ summary: 'Delete competitions by id' })
    @Secured(WildCardPermission)
    public async deleteHorsecompetitionPictureById(
        @Param('competitionId') competitionId: ObjectId,
        @Param('horseId') horseId: ObjectId,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId], HorsePermission.HorseEdit);
        return this._horseCompetitionService.deleteHorseCompetitionPictureById(competitionId);
    }
}
