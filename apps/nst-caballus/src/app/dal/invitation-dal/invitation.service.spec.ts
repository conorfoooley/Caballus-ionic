import { Test, TestingModule } from '@nestjs/testing';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { HorseRoleService } from '../horse-role-dal/horse-role.service';
import { HorseService } from '../horse-dal/horse.service';
import { UserService } from '../user-dal/user.service';
import { MailerService } from '@rfx/njs-mailer';
import {
    User,
    Horse,
    HorseRole,
    Invitation,
    InvitationRecipient,
    InvitationStatus
} from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { HorseRepository } from './horse.repository';
import { UserRepository } from './user.repository';
import { UserHorseRelationshipService } from '..';
import { DbModule, ConnectionType } from '@rfx/nst-db';
import { environment } from '@nst-caballus/env';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';

const MockInvitationRepo = {
    getInvitationById: jest.fn(),
    createInvitation: jest.fn(),
    updateInvitation: jest.fn(),
    getInvitation: jest.fn(),
    getInvitationsFromUser: jest.fn(),
    countInvitations: jest.fn()
};
const MockHorseRoleService = {
    getOwnerRole: jest.fn()
};
const MockUserService = {
    getUserByEmail: jest.fn()
};
const MockMailerService = {
    send: jest.fn()
};
const MockUserHorseRelationshipService = {
    updateUserHorseRelationship: jest.fn()
};
const MockHorseRepo = {
    getHorseById: jest.fn()
};
const MockUserRepo = {
    getUserByEmail: jest.fn()
};

describe('InvitationService', () => {
    let invitationService: InvitationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                DbModule.forRoot({
                    name: '',
                    type: ConnectionType.MongoDB,
                    ...environment.mongo
                }),
            ],
            providers: [
                { provide: InvitationRepository, useValue: MockInvitationRepo },
                { provide: HorseRoleService, useValue: MockHorseRoleService },
                { provide: UserService, useValue: MockUserService },
                { provide: MailerService, useValue: MockMailerService },
                { provide: UserHorseRelationshipService, useValue: MockUserHorseRelationshipService },
                { provide: HorseRepository, useValue: MockHorseRepo },
                { provide: UserRepository, useValue: MockUserRepo },
                InvitationService,
            ]
        }).compile();
        invitationService = module.get<InvitationService>(InvitationService);
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(invitationService).toBeDefined();
    });

    it('should create a horse transfer invitation', async () => {
        MockUserService.getUserByEmail.mockResolvedValueOnce(new User());
        MockHorseRoleService.getOwnerRole.mockResolvedValueOnce(new HorseRole());
        MockInvitationRepo.countInvitations.mockResolvedValueOnce(0);
        MockInvitationRepo.createInvitation.mockResolvedValueOnce(new ObjectId());
        MockMailerService.send.mockResolvedValueOnce(true);
        const createdId = await invitationService.createHorseOwnershipTransferInvitation(
            { recipientEmail: 'duck@dodgers.com', horseId: new ObjectId() },
            new User()
        );
        const createdInvitation: Invitation = MockInvitationRepo.createInvitation.mock.calls[0][0];

        const existingRelationship = null;
        MockDbConnector.collection.findOne.mockResolvedValueOnce(existingRelationship);

        expect(createdId).toBeTruthy();
        expect(createdInvitation.to.email).toBe('duck@dodgers.com');
        expect(createdInvitation.invitationStatus).toBe(InvitationStatus.Sent);
    });

    it('should retrieve horse transfer invitations for a user', async () => {
        const forHorseId = new ObjectId();
        const toUserId = new ObjectId();
        const fromId = new ObjectId();
        const ownerId = new ObjectId();
        const forHorse = new Horse({ _id: forHorseId });
        const toUser = new User({ _id: toUserId });
        const from = new User({ _id: fromId });
        MockHorseRepo.getHorseById.mockResolvedValueOnce(forHorse);
        MockUserRepo.getUserByEmail.mockResolvedValueOnce(toUser);
        MockHorseRoleService.getOwnerRole.mockResolvedValueOnce(new HorseRole({ _id: ownerId }));
        MockInvitationRepo.getInvitationsFromUser.mockResolvedValueOnce([new Invitation({})]);
        const invitations = await invitationService.getSentOwnershipTransfersFromUser(from);
        expect(invitations).toHaveLength(1);
        const getCall = MockInvitationRepo.getInvitationsFromUser.mock.calls[0];
        expect((getCall[0] as ObjectId).toHexString()).toBe(fromId.toHexString());
        expect((getCall[1] as ObjectId).toHexString()).toBe(ownerId.toHexString());
        expect(getCall[2]).toBe(InvitationStatus.Sent);
    });

    it('should retract a horse transfer invitation', async () => {
        const horseId = new ObjectId();
        const ownerId = new ObjectId();
        const fromId = new ObjectId();
        const invitationId = new ObjectId();
        MockHorseRepo.getHorseById.mockResolvedValueOnce(new Horse({ _id: horseId }));
        MockHorseRoleService.getOwnerRole.mockResolvedValueOnce(new HorseRole({ _id: ownerId }));
        MockInvitationRepo.getInvitation.mockResolvedValueOnce(new Invitation({
            _id: invitationId,
            to: new InvitationRecipient({
                email: 'duck@dodgers.com'
            }),
            invitationStatus: InvitationStatus.Sent
        }));
        MockInvitationRepo.updateInvitation.mockResolvedValueOnce(undefined);
        MockMailerService.send.mockResolvedValueOnce(true);
        await invitationService.retractHorseOwnershipTransferInvitation(horseId, new User({ _id: fromId }));
        const getInvitationCall = MockInvitationRepo.getInvitation.mock.calls[0];
        expect((getInvitationCall[0] as ObjectId).toHexString()).toBe(horseId.toHexString());
        expect((getInvitationCall[1] as ObjectId).toHexString()).toBe(ownerId.toHexString());
        expect((getInvitationCall[2] as ObjectId).toHexString()).toBe(fromId.toHexString());
        expect((getInvitationCall[3])).toBe(InvitationStatus.Sent);
        const updateCall = MockInvitationRepo.updateInvitation.mock.calls[0];
        expect((updateCall[0] as ObjectId).toHexString()).toBe(invitationId.toHexString());
        expect(updateCall[1]).toMatchObject({ invitationStatus: InvitationStatus.Retracted });
    });
});
