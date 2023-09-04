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
    UploadedFiles,
} from '@nestjs/common';
import { HorseEvaluationService, HorseService } from '@nst-caballus/dal';
import { LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import { ApiOperation, ApiBearerAuth, ApiTags, ApiConsumes,  } from '@nestjs/swagger';
import {
    User,
    HorsePermission,
    HorseEvaluationSimple,
    UploadedFileObject,
    HorseMatrixSimple
} from '@caballus/api-common';
import { IdDto, ObjectId } from '@rfx/nst-db/mongo';
import { HorseEvaluationDto } from './dto/horse-evaluation.dto';
import { CreateHorseEvaluationMatrixDto } from './dto/create-horse-evaluation-matrix.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('evaluations')
@Controller('evaluations')
export class HorseEvaluationController {
    constructor(
        private readonly _horseService: HorseService,
        private readonly _horseEvaluationService: HorseEvaluationService
    ) { }


    @Get(':id/list')
    @ApiOperation({ summary: 'Get all evaluations by horse id' })
    @Secured(WildCardPermission)
    public async getHorseEvaluationList(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseEvaluationSimple[]> {
        await this._horseService.checkUserHasHorsePermission(user._id, [idDto.id], HorsePermission.HorseView);
        return this._horseEvaluationService.getHorseEvaluationByHorseId(idDto.id);
    }

    @Get(':id/matrixes/list')
    @ApiOperation({ summary: 'Get all evaluations matrix by evaluation id' })
    @Secured(WildCardPermission)
    public async getHorseEvaluationMatrixListByEvaluationId(
        @Param() idDto: IdDto,
        @Query() horseIdDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseMatrixSimple[]> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseIdDto.id], HorsePermission.HorseView);
        return this._horseEvaluationService.getHorseEvaluationMatrixByEvaluationId(idDto.id, horseIdDto.id);
    }

    @Post('horseEvaluationMatrix')
    @ApiOperation({ summary: 'Create a horse evaluation matrix with document.' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'documents[]', maxCount: 5 }
        ], { limits: { fileSize: 52428800 } })
    )
    public async createUpdateHorseEvaluationMatrix(
        @Body() dto: CreateHorseEvaluationMatrixDto,
        @UploadedFiles() files: UploadedFileObject[],
        @LoggedInUser() user: User
    ): Promise<ObjectId> {
        const documents = files['documents[]'];
        await this._horseService.checkUserHasHorsePermission(user._id, [dto.horseId], HorsePermission.HorseEdit);
        return this._horseEvaluationService.createUpdateHorseEvaluationMatrix(user, dto, documents);
    }

    @Post(':id')
    @ApiOperation({ summary: 'Save evaluations by horse id' })
    @Secured(WildCardPermission)
    public async saveHorseEvaluation(
        @Param() horseId: IdDto,
        @LoggedInUser() user: User,
        @Body() dto: HorseEvaluationDto,
    ): Promise<ObjectId> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId.id], HorsePermission.HorseEdit);
        return this._horseEvaluationService.saveHorseEvaluation(horseId.id, dto);
    }

    @Put(':horseId/:evaluationId')
    @ApiOperation({ summary: 'Save evaluations by evaluation id' })
    @Secured(WildCardPermission)
    public async updateHorseEvaluationById(
        @Param('evaluationId') evaluationId: ObjectId,
        @Param('horseId') horseId: ObjectId,
        @LoggedInUser() user: User,
        @Body() dto: HorseEvaluationDto,
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId], HorsePermission.HorseEdit);
        return this._horseEvaluationService.updateHorseEvaluationById(evaluationId, dto);
    }

    @Delete('horseEvaluationMatrix/:horseId/:horseEvaluationMatrixId')
    @ApiOperation({ summary: 'Delete evaluations by id' })
    @Secured(WildCardPermission)
    public async deleteHorseMatrixById(
        @Param('horseEvaluationMatrixId') horseEvaluationMatrixId: ObjectId,
        @Param('horseId') horseId: ObjectId,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId], HorsePermission.HorseEdit);
        return this._horseEvaluationService.deleteHorseMatrixById(horseEvaluationMatrixId);
    }


    @Delete(':horseId/:evaluationId')
    @ApiOperation({ summary: 'Delete evaluations by id' })
    @Secured(WildCardPermission)
    public async deleteHorseEvaluationById(
        @Param('evaluationId') evaluationId: ObjectId,
        @Param('horseId') horseId: ObjectId,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(user._id, [horseId], HorsePermission.HorseEdit);
        return this._horseEvaluationService.deleteHorseEvaluationById(evaluationId);
    }



}
