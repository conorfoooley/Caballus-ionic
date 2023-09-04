import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import {
    Horse,
    HorseRole,
    Invitation,
    InvitationDetailed,
    InvitationRecipient,
    InvitationStatus,
    InvitationType,
    User,
    UserHorseRelationshipAction,
    UserHorseRelationshipStatus,
    UserProfile
} from '@caballus/api-common';
import { ObjectId } from '@rfx/nst-db/mongo';
import { InvitationRepository } from './invitation.repository';
import { HorseRoleService } from '../horse-role-dal/horse-role.service';
import { MailerService } from '@rfx/njs-mailer';
import {
    BranchService,
    HorseGeneralInvitationEmailTemplate,
    HorseInvitationResponseEmailTemplate,
    HorseTransferEmailTemplate,
    HorseTransferResponseEmailTemplate,
    HorseTransferRetractedEmailTemplate,
    TransferSubscriptionResponseEmailTemplate
} from '@nst-caballus/library';
import { UserHorseRelationshipService } from '../user-horse-relationship-dal/user-horse-relationship.service';
import { UserRepository } from './user.repository';
import { HorseRepository } from './horse.repository';
import { TransferSubscriptionEmailTemplate } from '../../library/mail-templates/transfer-subscription-email-template';
import { UserProfileDto } from '../../controllers/user/dto/user-profile.dto';
import { FriendInviteEmailTemplate } from '../../library/mail-templates/friend-invite-email-template';
import { environment } from '@nst-caballus/env';
import { FriendRequestDto } from '../../controllers/invitation/dto/friend-request.dto';

interface OwnerInvitationData {
    recipientEmail: string;
    horseId: ObjectId;
}

interface GeneralInvitationData {
    toUserId: ObjectId;
    horseId: ObjectId;
    toRoleId: ObjectId;
}

@Injectable()
export class InvitationService {
    constructor(
        private readonly _invitationRepo: InvitationRepository,
        private readonly _horseRoleService: HorseRoleService,
        private readonly _horseRepo: HorseRepository,
        private readonly _userRepo: UserRepository,
        private readonly _mailerService: MailerService,
        private readonly _userHorseRelationshipService: UserHorseRelationshipService,
        private readonly _branchService: BranchService
    ) {}

    public async createHorseOwnershipTransferInvitation(
        data: OwnerInvitationData,
        from: User
    ): Promise<ObjectId> {
        const horse = await this._horseRepo.getHorseById(data.horseId);
        const recipient = await this._userRepo.getUserByEmail(data.recipientEmail);
        const ownerRole = await this._horseRoleService.getOwnerRole();
        const ownerInvitationCount = await this._invitationRepo.countInvitations(
            data.horseId,
            ownerRole._id,
            InvitationStatus.Sent
        );
        if (ownerInvitationCount > 0) {
            throw new BadRequestException('An ownership transfer has already been sent');
        }
        const invitationId = await this._createHorseInvitation(
            horse,
            recipient,
            from,
            ownerRole,
            InvitationType.OwnershipTransfer
        );

        // Email user
        const normalProfileLink = `${environment.ionBaseUrl}/tabs/horse-profile/detail-horse/general-tab/${horse._id}`;
        const branchProfileLink = await this._branchService.createBranchUrl({
            appendUrl: `/tabs/horse-profile/detail-horse/general-tab/${horse._id}`,
            $desktop_url: normalProfileLink
        });

        // Email user
        const normalTransferLinkLink = `${environment.ionBaseUrl}/tabs/horse-profile/invitation/${invitationId}`;
        const branchTransferLink = await this._branchService.createBranchUrl({
            appendUrl: `/tabs/horse-profile/invitation/${invitationId}`,
            $desktop_url: normalTransferLinkLink
        });

        const mail = new HorseTransferEmailTemplate(
            from,
            horse,
            invitationId,
            branchProfileLink,
            branchTransferLink
        );
        mail.addTo(data.recipientEmail);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }

        return invitationId;
    }

    public async subscriptionTransfer(newUser: UserProfileDto, owner: User): Promise<ObjectId> {
        const recipient = await this._userRepo.getUserById(newUser._id);
        const sender = new User(owner);
        const invitationId = await this._createSubscriptionInvitation(
            recipient,
            sender,
            InvitationType.SubscriptionTransfer
        );
        // Email user
        const normalUrl = `${
            environment.ionBaseUrl
        }/tabs/menu/profile/${sender._id.toHexString()}?subscriptionInvitationId=${invitationId.toHexString()}`;
        const branchUrl = await this._branchService.createBranchUrl({
            appendUrl: `/tabs/menu/profile/${sender._id.toHexString()}?subscriptionInvitationId=${invitationId.toHexString()}`,
            $desktop_url: normalUrl
        });
        const mail = new TransferSubscriptionEmailTemplate(recipient, sender, branchUrl);
        mail.addTo(newUser.email);

        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
        return newUser._id;
    }

    /**
     * getSubscriptionTransferDetails
     * @param invitationId
     */
    public async getSubscriptionTransferDetails(invitationId: ObjectId): Promise<Invitation> {
        const invitation = await this._invitationRepo.getInvitationById(invitationId);
        // verify if invitation is present
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        } else if (
            invitation.invitationStatus === InvitationStatus.Rejected ||
            invitation.invitationStatus === InvitationStatus.Accepted
        ) {
            // throw error when an invitation is already Accepted || Rejected
            throw new BadRequestException(
                'Sorry, you have already either accepted or denied the request for this person. ' +
                    'Please go to your Manage Account area if you want to review your existing arrangements.'
            );
        }
        return invitation;
    }

    /**
     * acceptSubscriptionTransfer
     * it accept the subscription transfer
     * @param invitationId
     */
    public async acceptSubscriptionTransfer(invitationId: ObjectId): Promise<ObjectId> {
        // get invitation details
        const invitation = await this._invitationRepo.getInvitationById(invitationId);
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        // prepare mail content
        const mailContent = `Dear ${invitation.from.label}, ${invitation.to.userIdentity.label} has accepted the
        payment responsibility for your Caballus account.`;
        // update subscription status as accepted
        await this._updateSubscriptionTransferStatus(
            invitationId,
            InvitationStatus.Accepted,
            invitation.from.email,
            'Transfer of Payment Responsibility Accepted.',
            mailContent
        );
        return invitationId;
    }

    /**
     * declineSubscriptionTransfer
     * it will decline the subscription transfer request and let requester know by sending an email
     * @param invitationId
     */
    public async declineSubscriptionTransfer(invitationId: ObjectId): Promise<ObjectId> {
        // get invitation details
        const invitation = await this._invitationRepo.getInvitationById(invitationId);
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        // prepare mail content
        const mailContent = `Dear ${invitation.from.label}, ${invitation.to.userIdentity.label} has declined the
        request to accept payment responsibility for your Caballus account.`;
        // update subscription status as rejected
        await this._updateSubscriptionTransferStatus(
            invitationId,
            InvitationStatus.Rejected,
            invitation.from.email,
            'Transfer of Payment Responsibility Declined.',
            mailContent
        );
        return invitationId;
    }

    /**
     * _updateSubscriptionTransferStatus
     * it updates the subscription transfer status and sends an email for the same
     * @param invitationId
     * @param status
     * @param mailTo
     * @param mailSubject
     * @param mailContent
     * @private
     */
    private async _updateSubscriptionTransferStatus(
        invitationId: ObjectId,
        status: InvitationStatus,
        mailTo: string,
        mailSubject: string,
        mailContent: string
    ): Promise<void> {
        // prepare mail object
        const mail = new TransferSubscriptionResponseEmailTemplate(mailSubject, mailContent);
        mail.addTo(mailTo);

        // send mail
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }

        // update invitation status
        await this._invitationRepo.updateInvitation(invitationId, {
            invitationStatus: status
        });
    }

    public async friendRequest(dto: FriendRequestDto, sender: User): Promise<ObjectId> {
        const newSender = new User(sender);

        // Email user
        const normalUrl = `${
            environment.ionBaseUrl
        }/tabs/menu/profile/${sender._id.toHexString()}?friendRequestId=${dto.friendRequestId.toHexString()}`;
        const branchUrl = await this._branchService.createBranchUrl({
            appendUrl: `/tabs/menu/profile/${dto._id.toHexString()}?friendRequestId=${dto.friendRequestId.toHexString()}`,
            $desktop_url: normalUrl
        });
        const mail = new FriendInviteEmailTemplate(dto, newSender, branchUrl);
        mail.addTo(dto.email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }

        return dto._id;
    }

    /**
     *
     * Create a non-owner horse invitation (e.g. for student, trainer)
     */
    public async createGeneralHorseInvitation(
        data: GeneralInvitationData,
        from: User
    ): Promise<ObjectId> {
        const horse = await this._horseRepo.getHorseById(data.horseId);
        const recipient = await this._userRepo.getUserById(data.toUserId);
        const role = await this._horseRoleService.getHorseRoleById(data.toRoleId);
        const ownerRole = await this._horseRoleService.getOwnerRole();

        if (role._id.equals(ownerRole._id)) {
            throw new BadRequestException(
                'Invalid role selection for this endpoint. Please use invitation/transferOwnership for ownership transfers'
            );
        }

        const invitationId = await this._createHorseInvitation(
            horse,
            recipient,
            from,
            role,
            InvitationType.General
        );

        // Email user
        const normalUrl = `${environment.ionBaseUrl}/tabs/horse-profile/invitation/${invitationId}`;
        const branchUrl = await this._branchService.createBranchUrl({
            appendUrl: `/tabs/horse-profile/invitation/${invitationId}`,
            $desktop_url: normalUrl
        });
        const mail = new HorseGeneralInvitationEmailTemplate(
            from,
            horse,
            invitationId,
            role.name,
            new User(recipient).toIdentity(),
            branchUrl
        );
        mail.addTo(recipient.profile.email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }

        return invitationId;
    }

    private async _createHorseInvitation(
        horse: Horse,
        recipient: User,
        from: User,
        toRole: HorseRole,
        type: InvitationType
    ): Promise<ObjectId> {
        const openInviations = await this._invitationRepo.getInvitationsForUser(
            recipient._id,
            horse._id,
            InvitationStatus.Sent
        );
        if (openInviations.length > 0) {
            throw new BadRequestException(
                `User has already been invited to be ${openInviations[0].horseRoleIdentity.label}. Delete existing invitation to invite to another role.`
            );
        }

        // For some reason code is not recognizing 'toIdentity' function on recipient if new User() isn't called within this function scope
        recipient = new User(recipient);

        const invitation = new Invitation({
            from: from.toIdentity(),
            to: new InvitationRecipient({
                email: recipient.profile.email,
                userIdentity: !!recipient ? recipient.toIdentity() : null
            }),
            horseIdentity: horse.toIdentity(),
            horseRoleIdentity: toRole.toIdentity(),
            invitationType: type,
            invitationStatus: InvitationStatus.Sent
        });

        const invitationId = await this._invitationRepo.createInvitation(invitation);

        await this._userHorseRelationshipService.updateUserHorseRelationship(
            recipient.toIdentity(),
            horse.toIdentity(),
            toRole,
            UserHorseRelationshipStatus.Pending,
            from.toIdentity()
        );

        return invitationId;
    }

    private async _createSubscriptionInvitation(
        recipient: User,
        from: User,
        type: InvitationType
    ): Promise<ObjectId> {
        // For some reason code is not recognizing 'toIdentity' function on recipient if new User() isn't called within this function scope
        // recipient = new User(recipient);

        const invitation = new Invitation({
            from: from.toIdentity(),
            to: new InvitationRecipient({
                email: recipient.profile.email,
                userIdentity: !!recipient ? recipient.toIdentity() : null
            }),
            invitationType: type,
            invitationStatus: InvitationStatus.Sent
        });

        return await this._invitationRepo.createInvitation(invitation);
    }

    public async getSentOwnershipTransfersFromUser(from: User): Promise<Invitation[]> {
        const ownerRole = await this._horseRoleService.getOwnerRole();
        return this._invitationRepo.getInvitationsFromUser(
            from._id,
            ownerRole._id,
            InvitationStatus.Sent
        );
    }

    public async retractHorseOwnershipTransferInvitation(
        horseId: ObjectId,
        from: User
    ): Promise<void> {
        const horse = await this._horseRepo.getHorseById(horseId);
        const ownerRole = await this._horseRoleService.getOwnerRole();
        const invitation = await this._invitationRepo.getInvitation(
            horseId,
            ownerRole._id,
            from._id,
            InvitationStatus.Sent
        );
        if (!invitation) {
            throw new NotFoundException();
        }

        await this._retractInvitation(invitation, from);

        const mail = new HorseTransferRetractedEmailTemplate(from, horse);
        mail.addTo(invitation.to.email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    /**
     *
     * Retracts any non-owner invitations, pending or accepted
     * If invitation was accepted, user's connected relationship with the horse will be removed entirely
     */
    public async retractGeneralHorseInvitation(invitation: Invitation, lUser: User): Promise<void> {
        const ownerRole = await this._horseRoleService.getOwnerRole();
        if (invitation.horseRoleIdentity._id.equals(ownerRole._id)) {
            throw new BadRequestException(
                'Please use invitation/transferOwnership/retract to retract Owner invitations'
            );
        }

        await this._retractInvitation(invitation, lUser);
    }

    private async _retractInvitation(invitation: Invitation, lUser: User): Promise<void> {
        await this._invitationRepo.updateInvitation(invitation._id, {
            invitationStatus: InvitationStatus.Retracted
        });

        const toRole = await this._horseRoleService.getHorseRoleById(
            invitation.horseRoleIdentity._id
        );
        await this._userHorseRelationshipService.updateUserHorseRelationship(
            invitation.to.userIdentity,
            invitation.horseIdentity,
            toRole,
            UserHorseRelationshipStatus.Removed,
            lUser.toIdentity()
        );
    }

    private async _rejectInvitation(invitation: Invitation, lUser: User): Promise<void> {
        await this._invitationRepo.updateInvitation(invitation._id, {
            invitationStatus: InvitationStatus.Rejected
        });

        const toRole = await this._horseRoleService.getHorseRoleById(
            invitation.horseRoleIdentity._id
        );
        await this._userHorseRelationshipService.updateUserHorseRelationship(
            invitation.to.userIdentity,
            invitation.horseIdentity,
            toRole,
            UserHorseRelationshipStatus.Rejected,
            lUser.toIdentity()
        );
    }

    public async getInvitationById(id: ObjectId): Promise<Invitation> {
        return this._invitationRepo.getInvitationById(id);
    }

    public async acceptGeneralHorseInvitation(invitation: Invitation, lUser: User): Promise<void> {
        if (!lUser._id.equals(invitation.to.userIdentity._id)) {
            throw new BadRequestException('Not permitted to access this invitation');
        }
        await this._invitationRepo.updateInvitation(invitation._id, {
            invitationStatus: InvitationStatus.Accepted
        });

        const toRole = await this._horseRoleService.getHorseRoleById(
            invitation.horseRoleIdentity._id
        );
        await this._userHorseRelationshipService.updateUserHorseRelationship(
            invitation.to.userIdentity,
            invitation.horseIdentity,
            toRole,
            UserHorseRelationshipStatus.Connected,
            lUser.toIdentity()
        );

        const originalOwner = await this._userRepo.getUserById(invitation.from._id);
        await this._userRepo.followHorseByUserId(lUser, invitation.horseIdentity);
        const mail = new HorseInvitationResponseEmailTemplate(
            invitation.from,
            invitation.to.userIdentity,
            invitation.horseIdentity,
            UserHorseRelationshipAction.Accept,
            invitation.horseRoleIdentity.label
        );
        mail.addTo(originalOwner.profile.email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    public async acceptOwnershipTransferInvitation(
        invitation: Invitation,
        lUser: User
    ): Promise<void> {
        if (!lUser._id.equals(invitation.to.userIdentity._id)) {
            throw new BadRequestException('Not permitted to access this invitation');
        }
        if (invitation.invitationType !== InvitationType.OwnershipTransfer) {
            throw new BadRequestException(
                'Please use invitation/invite/accept to accept non-owner invitations'
            );
        }
        await this._invitationRepo.updateInvitation(invitation._id, {
            invitationStatus: InvitationStatus.Accepted
        });

        const toRole = await this._horseRoleService.getHorseRoleById(
            invitation.horseRoleIdentity._id
        );
        await this._userHorseRelationshipService.updateUserHorseRelationship(
            invitation.to.userIdentity,
            invitation.horseIdentity,
            toRole,
            UserHorseRelationshipStatus.Connected,
            lUser.toIdentity()
        );
        await this._userHorseRelationshipService.updateUserHorseRelationship(
            invitation.from,
            invitation.horseIdentity,
            toRole,
            UserHorseRelationshipStatus.Removed,
            lUser.toIdentity()
        );

        const originalOwner = await this._userRepo.getUserById(invitation.from._id);
        const mail = new HorseTransferResponseEmailTemplate(
            invitation.from,
            invitation.to.userIdentity,
            invitation.horseIdentity,
            UserHorseRelationshipAction.Accept
        );
        mail.addTo(originalOwner.profile.email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    public async rejectInvitation(invitation: Invitation, lUser: User): Promise<void> {
        await this._rejectInvitation(invitation, lUser);
        const originalOwner = await this._userRepo.getUserById(invitation.from._id);
        let mail;

        switch (invitation.invitationType) {
            case InvitationType.OwnershipTransfer:
                mail = new HorseTransferResponseEmailTemplate(
                    invitation.from,
                    invitation.to.userIdentity,
                    invitation.horseIdentity,
                    UserHorseRelationshipAction.Reject
                );
                break;
            case InvitationType.General:
                mail = new HorseInvitationResponseEmailTemplate(
                    invitation.from,
                    invitation.to.userIdentity,
                    invitation.horseIdentity,
                    UserHorseRelationshipAction.Reject,
                    invitation.horseRoleIdentity.label
                );
                break;
            default:
                throw new BadRequestException('Invalid invitation type, cannot send email');
        }

        mail.addTo(originalOwner.profile.email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    public async getInvitationDetailedListByHorseId(
        horseId: ObjectId,
        includeOwner: boolean = false,
        onlySent: boolean = false
    ): Promise<InvitationDetailed[]> {
        const invites = await this._invitationRepo.getInvitationsByHorseId(
            horseId,
            onlySent ? [InvitationStatus.Sent] : [InvitationStatus.Accepted, InvitationStatus.Sent],
            includeOwner
        );
        const userIds = invites
            .filter(i => !!i.to.userIdentity && !!i.to.userIdentity._id)
            .map(i => i.to.userIdentity._id);
        const allUsers = await this._userRepo.getUsersByIdList(userIds);
        const res = invites.map(i => {
            const toUser =
                !!i.to.userIdentity && !!i.to.userIdentity._id
                    ? allUsers.find(u => u._id.equals(i.to.userIdentity._id))
                    : null;
            return new InvitationDetailed({
                ...i,
                toUserPhone: !!toUser ? toUser.profile.phone : null,
                toUserAddress: !!toUser ? toUser.profile.address : null
            });
        });
        return res;
    }
}
