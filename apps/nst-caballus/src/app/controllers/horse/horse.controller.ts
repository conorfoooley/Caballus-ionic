import {
    Controller,
    Post,
    Body,
    Put,
    Param,
    Get,
    Delete,
    Query,
    UseInterceptors,
    UploadedFile,
    Patch,
    UploadedFiles,
    NotFoundException,
    BadRequestException,
    Res
} from '@nestjs/common';
import { HorseService, InvitationService } from '@nst-caballus/dal';
import { LoggedInUser, Secured, WildCardPermission, Anonymous } from '@rfx/nst-permissions';
import { ApiOperation, ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import {
    User,
    Permission,
    Horse,
    HorseForRide,
    HorseRelationshipsSimple,
    HorsePermission,
    HorseStatTotals,
    UploadedFileObject,
    HorseProfileStatus,
    HorseVeterinarianProfile,
    HorseHealthSimple,
    HorseHealthType,
    InvitationStatus,
    HorseSummaryForInvitation,
    Ride,
    RideHistorySimple,
    HorseBasicProfile,
    HorseIdentity
} from '@caballus/api-common';
import { HorsesDto } from './dto/horses.dto';
import { ObjectId, IdDto } from '@rfx/nst-db/mongo';
import { IdListDto } from '../id-list.dto';
import { HorseDto } from './dto/horse.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { HorseBioDto } from './dto/horse-bio.dto';
import { HorseGaitsDto } from './dto/horse-gaits.dto';
import { HorseVeterinarianProfileDto } from './dto/horse-veterinarian-profile.dto';
import { CreateHorseHealthDto } from './dto/create-horse-health.dto';
import { HorseProfilePrivacyDto } from './dto/horse-profile-privacy.dto';
import { PaginatedListModel } from '@rfx/common';
import { HorseShareDto } from './dto/horse-share.dto';
import { RideHistoryByUserIdDto } from './dto/ride-history-by-user-id.dto';

@ApiBearerAuth()
@ApiTags('horse')
@Controller('horse')
export class HorseController {
    constructor(
        private readonly _horseService: HorseService,
        private readonly _invitationService: InvitationService
    ) {}

    @Post('')
    @ApiOperation({ summary: 'Create Horses' })
    @Secured(Permission.HorseCreate)
    public async createHorses(
        @Body() dto: HorsesDto,
        @LoggedInUser() user: User
    ): Promise<ObjectId[]> {
        user = new User(user); // TODO checking with team, better way to handle this?
        return this._horseService.createHorses(dto.horses as Partial<Horse>[], user);
    }

    @Post('/create')
    @ApiOperation({ summary: 'Create Horse' })
    @Secured(Permission.HorseCreate)
    public async createHorse(@Body() dto: HorseDto, @LoggedInUser() user: User): Promise<ObjectId> {
        user = new User(user); // TODO checking with team, better way to handle this?
        return this._horseService.createHorse(dto as Partial<Horse>, user);
    }

    @Get('/forRide')
    @ApiOperation({ summary: 'Get Horses For Ride' })
    @Secured(WildCardPermission)
    public async getHorsesForRide(@LoggedInUser() user: User): Promise<HorseForRide[]> {
        return this._horseService.getHorsesForRide(user._id);
    }

    @Post('/ongoingRide')
    @ApiOperation({ summary: 'Get Horses on an Ongoing Ride By HorseIds' })
    @Secured(WildCardPermission)
    public async getHorsesOnOngoingRide(@Body() dto: IdListDto): Promise<Ride[]> {
        return this._horseService.getOngoingRideHorseIds(dto.ids);
    }

    @Get('/list')
    @ApiOperation({ summary: 'Get All Viewable Horses' })
    @Secured(WildCardPermission)
    public async getHorseList(@LoggedInUser() user: User): Promise<Horse[]> {
        return this._horseService.getViewableHorses(user._id);
    }

    @Get('/basic')
    @ApiOperation({ summary: 'Get Horse by horseIds' })
    @Secured(WildCardPermission)
    public async getHorseBasic(@Query() IdDto: IdDto): Promise<Horse> {
        return this._horseService.getHorseBasic(IdDto.id);
    }

    @Get('/profile/relationships')
    @ApiOperation({ summary: 'Get Horse Relationships For Profile' })
    @Secured(WildCardPermission)
    public async getHorseRelationships(
        @Query() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseRelationshipsSimple> {
        return this._horseService.getHorseRelationships(idDto.id, user);
    }

    @Post('/profile/relationships/list')
    @ApiOperation({ summary: 'Get Horse Relationships List' })
    @Secured(WildCardPermission)
    public async getHorseRelationshipsList(
        @Body() idsDto: IdListDto,
        @LoggedInUser() user: User
    ): Promise<HorseRelationshipsSimple[]> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            idsDto.ids,
            HorsePermission.HorseView
        );
        return this._horseService.getHorseRelationshipsList(idsDto.ids, user);
    }

    @Get('/profile/statTotals')
    @ApiOperation({ summary: 'Get Horse Stat Totals For Profile' })
    @Secured(WildCardPermission)
    public async getHorseStatTotals(
        @Query() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseStatTotals> {
        // await this._horseService.checkUserHasHorsePermission(user._id, [idDto.id], HorsePermission.HorseView);
        return this._horseService.getHorseStatTotals(idDto.id);
    }

    @Post('/profile/statTotals/list')
    @ApiOperation({ summary: 'Get Horse Stat Totals List' })
    @Secured(WildCardPermission)
    public async getHorseStatTotalsList(
        @Body() idsDto: IdListDto,
        @LoggedInUser() user: User
    ): Promise<HorseStatTotals[]> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            idsDto.ids,
            HorsePermission.HorseView
        );
        const res = [];
        for (const id of idsDto.ids) {
            const s = await this._horseService.getHorseStatTotals(id);
            res.push(s);
        }
        return res;
    }

    /**
     * Note: Returns distance per ride rather than per day
     * So the front end can determine distance per day using user timezone
     * @param idDto
     * @param user
     * @returns
     */
    @Get('/profile/distancePerRide')
    @ApiOperation({ summary: 'Get Horse Distance Per Ride For Profile' })
    @Secured(WildCardPermission)
    public async getHorseDistancePerDay(
        @Query() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<{ date: Date; distanceKilometers: number }[]> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseView
        );
        return this._horseService.getHorseDistancePerRide(idDto.id);
    }

    @Post('profilePicture')
    @ApiOperation({ summary: 'Add Profile Image to Horse' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20000000 } }))
    public async editProfilePicture(
        @Body() idDto: IdDto,
        @LoggedInUser() user: User,
        @UploadedFile() file: UploadedFileObject
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.editProfilePicture(idDto.id, file);
    }

    @Patch('')
    @ApiOperation({ summary: 'Edit Horse Bio' })
    @Secured(WildCardPermission)
    public async editHorseBio(
        @Body() idDto: IdDto,
        @Body() dto: HorseBioDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.editHorseBio(idDto.id, dto);
    }

    @Patch('privacy')
    @ApiOperation({ summary: 'Edit Horse Privacy' })
    @Secured(WildCardPermission)
    public async editHorsePrivacy(
        @Body() idDto: IdDto,
        @Body() dto: HorseProfilePrivacyDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.editHorsePrivacy(idDto.id, dto);
    }

    @Patch('gaits')
    @ApiOperation({ summary: 'Edit horse gaits' })
    @Secured(WildCardPermission)
    public async editHorseGaits(
        @Body() idDto: IdDto,
        @Body() dto: HorseGaitsDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.updateHorse(idDto.id, dto);
    }

    @Put('delete')
    @ApiOperation({ summary: 'Delete Horse by ids' })
    @Secured(WildCardPermission)
    public async deleteHorsesByIdList(
        @Body() idsDto: IdListDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            idsDto.ids,
            HorsePermission.HorseDelete
        );
        return this._horseService.deleteHorsesByIdList(idsDto.ids);
    }

    @Put(':id/profileStatus')
    @ApiOperation({ summary: 'Update Horse status by id' })
    @Secured(WildCardPermission)
    public async toggleHorseProfileStatus(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseProfileStatus> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEnable
        );
        return this._horseService.toggleHorseProfileStatus(idDto.id);
    }

    @Get('veterinarianProfile')
    @ApiOperation({ summary: 'Get Horse Veterinarian Profile' })
    @Secured(WildCardPermission)
    public async getHorseVeterinarianProfile(
        @Query() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseVeterinarianProfile> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseView
        );
        return this._horseService.getHorseVeterinarianProfileById(idDto.id);
    }

    @Put(':id/veterinarianProfile')
    @ApiOperation({ summary: 'Add/Edit Horse Veterinarian Profile' })
    @Secured(WildCardPermission)
    public async updateHorseVeterinarianProfile(
        @Param() idDto: IdDto,
        @Body() dto: HorseVeterinarianProfileDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.updateHorseVeterinarianProfileById(idDto.id, dto);
    }

    @Get(':id/basic-profile')
    @Anonymous()
    @ApiOperation({ summary: 'Get basic horse profile' })
    public async getBasicHorseProfile(@Param() idDto: IdDto): Promise<HorseBasicProfile> {
        return this._horseService.getBasicHorseProfile(idDto.id);
    }

    @Get('horseHealth')
    @ApiOperation({ summary: 'Get Horse Healths with documents' })
    @Secured(WildCardPermission)
    public async getHorseHealths(
        @Query() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseHealthSimple[]> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseView
        );
        return this._horseService.getHorseHealthByHorseId(idDto.id);
    }

    @Post('horseHealth/create')
    @ApiOperation({ summary: 'Create a horse health with document.' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([{ name: 'documents[]', maxCount: 2 }], {
            limits: { fileSize: 52428800 }
        })
    )
    public async createHorseHealth(
        @Body() dto: CreateHorseHealthDto,
        @UploadedFiles() files: UploadedFileObject[],
        @LoggedInUser() user: User
    ): Promise<ObjectId> {
        const documents = files['documents[]'];
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [dto.horseId],
            HorsePermission.HorseEdit
        );
        return this._horseService.createHorseHealth(user, dto, documents);
    }

    @Put('horseHealth/:id')
    @ApiOperation({ summary: 'Edit a horse health with document.' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([{ name: 'documents[]', maxCount: 2 }], {
            limits: { fileSize: 52428800 }
        })
    )
    public async editHorseHealth(
        @Param() idDto: IdDto,
        @Body() dto: CreateHorseHealthDto,
        @UploadedFiles() files: UploadedFileObject[],
        @LoggedInUser() user: User
    ): Promise<void> {
        const {
            horseId,
            ...rest
        }: {
            horseId: ObjectId;
            notes: string;
            date: Date;
            horseHealthType: HorseHealthType;
        } = dto;
        const documents = files['documents[]'];
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [horseId],
            HorsePermission.HorseEdit
        );
        return this._horseService.editHorseHealth(user, idDto.id, rest, documents);
    }

    @Delete('horseHealth/document/:id')
    @ApiOperation({ summary: 'Delete a horse health document by id' })
    @Secured(WildCardPermission)
    public async deleteHorseHealthDocumentById(
        @Param() idDto: IdDto,
        @Query() horseIdDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [horseIdDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.deleteHorseHealthDocumentById(idDto.id);
    }

    @Delete('horseHealth/:id')
    @ApiOperation({ summary: 'Delete horse health with all documents' })
    @Secured(WildCardPermission)
    public async deleteHorseHealth(
        @Param() idDto: IdDto,
        @Query() horseIdDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [horseIdDto.id],
            HorsePermission.HorseEdit
        );
        return this._horseService.deleteHorseHealthById(idDto.id);
    }

    @Get('byInvitation/:id')
    @ApiOperation({ summary: 'Get Horse Summary By Invitation Id' })
    @Secured(WildCardPermission)
    public async getHorseSummaryByInvitationId(
        @Param() dto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseSummaryForInvitation> {
        const invitation = await this._invitationService.getInvitationById(dto.id);
        if (!invitation) {
            throw new NotFoundException();
        }
        if (!invitation.to.userIdentity._id.equals(user._id)) {
            throw new BadRequestException('Not permitted to access this invitation');
        }
        if (invitation.invitationStatus !== InvitationStatus.Sent) {
            throw new BadRequestException('Invalid invitation status for horse retrieval');
        }
        return this._horseService.getHorseInvitationSummaryById(
            invitation.horseIdentity._id,
            invitation
        );
    }

    @Get('/profile/rideHistory')
    @ApiOperation({ summary: 'Get Horse Ride history by horse id' })
    @Secured(WildCardPermission)
    public async getRideHistory(
        @Query() idDto: IdDto,
        @Query('skipRecord') skipRecord: number,
        @LoggedInUser() user: User
    ): Promise<PaginatedListModel<RideHistorySimple>> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseView
        );
        return this._horseService.getRideHistory(idDto.id, skipRecord);
    }

    @Get('/profile/rideHistoryByUserId')
    @ApiOperation({ summary: 'Get Horse Ride history by user id' })
    @Secured(WildCardPermission)
    public async getRideHistoryByUserId(
        @Query() dto: RideHistoryByUserIdDto
    ): Promise<PaginatedListModel<RideHistorySimple>> {
        return this._horseService.getRideHistoryByUserId(dto.id, dto.skipRecord);
    }

    @Get('/ride')
    @ApiOperation({ summary: 'Get Horse Ride history by horse id and ride id' })
    @Secured(WildCardPermission)
    public async getRideById(
        @Query('horseId') horseId: string,
        @Query('rideId') rideId: string,
        @LoggedInUser() user: User
    ): Promise<RideHistorySimple> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [new ObjectId(horseId)],
            HorsePermission.HorseView
        );
        return this._horseService.getRideById(new ObjectId(rideId));
    }

    @Get('/profile/share')
    @Anonymous()
    @ApiOperation({ summary: 'Share horse profile html' })
    public async shareHorseProfile(
        @Query() horseShareDto: HorseShareDto,
        @Res() res
    ): Promise<void> {
        const html = await this._horseService.shareHorseProfile(horseShareDto);
        res.send(html);
    }

    @Put(':id/follow')
    @ApiOperation({ summary: 'Follow/Un follow horse' })
    @Secured(WildCardPermission)
    public async followUnfollowHorse(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<HorseIdentity[]> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseView
        );
        return this._horseService.followUnfollowHorse(idDto.id, user._id);
    }

    @Get(':id/follow')
    @ApiOperation({ summary: 'Follow/Un follow horse by id' })
    @Secured(WildCardPermission)
    public async isHorseFollowed(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<boolean> {
        // await this._horseService.checkUserHasHorsePermission(
        //     user._id,
        //     [idDto.id],
        //     HorsePermission.HorseView
        // );
        return this._horseService.isHorseFollowed(idDto.id, user._id);
    }
}
