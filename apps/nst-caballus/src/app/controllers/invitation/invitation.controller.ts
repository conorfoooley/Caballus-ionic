import {
    BadRequestException,
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import {
    HorsePermission,
    Invitation,
    InvitationDetailed,
    InvitationStatus,
    User
} from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { IdDto } from '@rfx/nst-db/mongo/src';
import { HorseService, InvitationService } from '@nst-caballus/dal';
import { OwnerInvitationDto } from './dto/owner-invitation.dto';
import { GeneralInvitationDto } from './dto/general-invitation.dto';
import { GetInvitationsbyHorseDto } from './dto/get-invitations-by-horse.dto';
import { UserProfileDto } from '../user/dto/user-profile.dto';
import { FriendRequestDto } from './dto/friend-request.dto';

@Controller('invitation')
export class InvitationController {
    constructor(
        private readonly _invitationService: InvitationService,
        private readonly _horseService: HorseService
    ) {}

    @Get('/:id')
    @ApiOperation({ summary: 'Get Invitation details by id' })
    @Secured(WildCardPermission)
    public async getInvitationDetailsById(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<Invitation> {
        return this._invitationService.getInvitationById(idDto.id);
    }

    @Post('/transferOwnership')
    @ApiOperation({ summary: 'Create Ownership Transfer Invitation' })
    @Secured(WildCardPermission)
    public async createOwnershipTransferInvitation(
        @Body() dto: OwnerInvitationDto,
        @LoggedInUser() user: User
    ): Promise<ObjectId> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [dto.horseId],
            HorsePermission.HorseTransferOwnership
        );
        return this._invitationService.createHorseOwnershipTransferInvitation(dto, new User(user));
    }

    @Get('/transferOwnership/sent')
    @ApiOperation({ summary: 'Get Sent Ownership Transfers from User' })
    @Secured(WildCardPermission)
    public async getSentOwnershipTransfersFromUser(
        @LoggedInUser() user: User
    ): Promise<Invitation[]> {
        return this._invitationService.getSentOwnershipTransfersFromUser(new User(user));
    }

    @Put('/transferOwnership/retract/:id')
    @ApiOperation({ summary: 'Retract Ownership Transfer Invitation' })
    @Secured(WildCardPermission)
    public async retractOwnershipTransferInvitation(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseTransferOwnership
        );
        return this._invitationService.retractHorseOwnershipTransferInvitation(
            idDto.id,
            new User(user)
        );
    }

    @Put('/transferOwnership/accept/:id')
    @ApiOperation({ summary: 'Accept Ownership Transfer Invitation' })
    @Secured(WildCardPermission)
    public async acceptOwnershipTransferInvitation(
        @Param() dto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        const invitation = await this._invitationService.getInvitationById(dto.id);
        if (!invitation) {
            throw new NotFoundException();
        }
        if (invitation.invitationStatus !== InvitationStatus.Sent) {
            throw new BadRequestException('Invalid invitation status for acceptance');
        }
        return this._invitationService.acceptOwnershipTransferInvitation(
            invitation,
            new User(user)
        );
    }

    @Post('/subscription-transfer-details/')
    @ApiOperation({ summary: 'Get Transfer Subscription details by id' })
    @Secured(WildCardPermission)
    public async subscriptionTransferDetails(@Body() dto: IdDto): Promise<Invitation> {
        return await this._invitationService.getSubscriptionTransferDetails(dto.id);
    }

    @Post('/subscription-transfer')
    @ApiOperation({ summary: 'Transfer Subscription' })
    @Secured(WildCardPermission)
    public async subscriptionTransfer(
        @Body() newUser: UserProfileDto,
        @LoggedInUser() owner: User
    ): Promise<ObjectId> {
        return this._invitationService.subscriptionTransfer(newUser, owner);
    }

    @Post('/subscription-transfer/accept/')
    @ApiOperation({ summary: 'Transfer Subscription accepted' })
    @Secured(WildCardPermission)
    public async acceptSubscriptionTransfer(
        @Body() dto: IdDto,
        @LoggedInUser() owner: User
    ): Promise<ObjectId> {
        return this._invitationService.acceptSubscriptionTransfer(dto.id);
    }

    @Post('/subscription-transfer/decline')
    @ApiOperation({ summary: 'Transfer Subscription declined' })
    @Secured(WildCardPermission)
    public async declineSubscriptionTransfer(
        @Body() dto: IdDto,
        @LoggedInUser() owner: User
    ): Promise<ObjectId> {
        return this._invitationService.declineSubscriptionTransfer(dto.id);
    }

    @Post('/friend-request')
    @ApiOperation({ summary: 'Friend Request' })
    @Secured(WildCardPermission)
    public async friendRequest(
        @Body() recipient: FriendRequestDto,
        @LoggedInUser() sender: User
    ): Promise<ObjectId> {
        return this._invitationService.friendRequest(recipient, sender);
    }

    @Post('/invite')
    @ApiOperation({ summary: 'Create General Invitation' })
    @Secured(WildCardPermission)
    public async createGeneralInvitation(
        @Body() dto: GeneralInvitationDto,
        @LoggedInUser() user: User
    ): Promise<ObjectId> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [dto.horseId],
            HorsePermission.HorseInvite
        );
        return this._invitationService.createGeneralHorseInvitation(dto, new User(user));
    }

    @Put('/invite/retract/:id')
    @ApiOperation({ summary: 'Retract General Invitation' })
    @Secured(WildCardPermission)
    public async retractGeneralInvitation(
        @Param() dto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        const invitation = await this._invitationService.getInvitationById(dto.id);
        if (!invitation) {
            throw new NotFoundException();
        }
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [invitation.horseIdentity._id],
            HorsePermission.HorseInvite
        );
        return this._invitationService.retractGeneralHorseInvitation(invitation, new User(user));
    }

    @Put('/invite/accept/:id')
    @ApiOperation({ summary: 'Accept General Invitation' })
    @Secured(WildCardPermission)
    public async acceptGeneralInvitation(
        @Param() dto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        const invitation = await this._invitationService.getInvitationById(dto.id);
        if (!invitation) {
            throw new NotFoundException();
        }
        if (invitation.invitationStatus !== InvitationStatus.Sent) {
            throw new BadRequestException('Invalid invitation status for acceptance');
        }
        return this._invitationService.acceptGeneralHorseInvitation(invitation, new User(user));
    }

    @Put('/reject/:id')
    @ApiOperation({ summary: 'Reject Invitation' })
    @Secured(WildCardPermission)
    public async rejectInvitation(@Param() dto: IdDto, @LoggedInUser() user: User): Promise<void> {
        const invitation = await this._invitationService.getInvitationById(dto.id);
        if (!invitation) {
            throw new NotFoundException();
        }
        if (invitation.invitationStatus !== InvitationStatus.Sent) {
            throw new BadRequestException('Invalid invitation status for rejection');
        }
        return this._invitationService.rejectInvitation(invitation, new User(user));
    }

    @Get('/list/:id')
    @ApiOperation({ summary: 'Get Invitation Detailed List By Horse Id' })
    @Secured(WildCardPermission)
    public async getInvitationDetailedListByHorseId(
        @Param() idDto: IdDto,
        @Query() dto: GetInvitationsbyHorseDto
    ): Promise<InvitationDetailed[]> {
        return this._invitationService.getInvitationDetailedListByHorseId(
            idDto.id,
            dto.includeOwner,
            dto.onlySent
        );
    }
}
