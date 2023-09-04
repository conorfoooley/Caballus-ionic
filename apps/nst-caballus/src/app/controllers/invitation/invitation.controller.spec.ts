import { Test, TestingModule } from '@nestjs/testing';
import { HorseDalModule, HorseService, InvitationDalModule, InvitationService } from '@nst-caballus/dal';
import { InvitationController } from './invitation.controller';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { environment } from '@nst-caballus/env';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { MailerService } from '@rfx/njs-mailer';
import { FileModule, FileService, GoogleFileOptions } from '@rfx/nst-file';
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import {
    UserHorseRelationshipAction,
    Horse,
    Role,
    User,
    InvitationStatus,
    UserHorseRelationshipStatus,
    UserHorseRelationship,
    HorseUserRelationshipHistory,
    UserIdentity,
    HorseIdentity,
    Invitation,
    HorseRole,
    UserProfile,
    InvitationType,
    Address
} from '@caballus/api-common';
import { MockCursor, mockId } from '../../unit-test-helpers/mock-db/mock-db-util';
import { ObjectId } from 'mongodb';

const MockMailService = {
    send: jest.fn()
};

describe('Invitation Controller Test', () => {
    let controller: InvitationController;
    let invitationService: InvitationService;
    let horseService: HorseService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [InvitationController],
            imports: [
                InvitationDalModule,
                HorseDalModule,
                DbModule.forRoot({
                    name: '',
                    type: ConnectionType.MongoDB,
                    ...environment.mongo
                }),
                FileModule.forRoot(new GoogleFileOptions()),
            ],
            providers: [MockDbConnector]
        })
        .overrideProvider(DbConnector).useClass(MockDbConnector)
        .overrideProvider(FileService).useValue(MockFileService)
        .overrideProvider(MailerService).useValue(MockMailService)
        .compile();

        controller = module.get<InvitationController>(InvitationController);
        invitationService = module.get<InvitationService>(InvitationService);
        horseService = module.get<HorseService>(HorseService);
    });

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an invitation', async () => {
        const inviteToHorse = new Horse({ _id: mockId(1) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToHorse);
        const inviteToUser = new User({ _id: mockId(2) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToUser);
        const inviteToRole = new Role({ _id: mockId(5) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToRole);
        const mockOwnerRole = new Role({ _id: mockId(6) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockOwnerRole);
        const openInvitations = [];
        MockDbConnector.collection.find.mockReturnValueOnce(new MockCursor(openInvitations));
        const insertedInviteId = mockId(4);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: insertedInviteId });
        const existingRelationship = null;
        MockDbConnector.collection.findOne.mockResolvedValueOnce(existingRelationship);

        const loggedInUser = new User({ _id: mockId(3) });
        try {
            await invitationService.createGeneralHorseInvitation(
                {
                    toUserId: inviteToUser._id,
                    toRoleId: inviteToRole._id,
                    horseId: inviteToHorse._id
                },
                loggedInUser
            );
        } catch (e) {
            console.log(e);
        }

        const expectedInsert = {
            invitationStatus: InvitationStatus.Sent,
            horseIdentity: expect.objectContaining({ _id: inviteToHorse._id }),
            horseRoleIdentity: expect.objectContaining({ _id: inviteToRole._id }),
            from: expect.objectContaining({ _id: loggedInUser._id }),
            to: expect.objectContaining({ userIdentity: expect.objectContaining({ _id: inviteToUser._id }) }),
        };
        expect(MockDbConnector.collection.insertOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining(expectedInsert)
        );
    });

    it('should should create UserHorseRelationshp after invitation if one did not exist', async () => {
        const inviteToHorse = new Horse({ _id: mockId(1) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToHorse);
        const inviteToUser = new User({ _id: mockId(2) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToUser);
        const inviteToRole = new Role({ _id: mockId(5) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToRole);
        const mockOwnerRole = new Role({ _id: mockId(6) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockOwnerRole);
        const openInvitations = [];
        MockDbConnector.collection.find.mockReturnValueOnce(new MockCursor(openInvitations));
        const insertedInviteId = mockId(4);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: insertedInviteId });
        const existingRelationship = null;
        MockDbConnector.collection.findOne.mockResolvedValueOnce(existingRelationship);

        const loggedInUser = new User({ _id: mockId(3) });
        try {
            await invitationService.createGeneralHorseInvitation(
                {
                    toUserId: inviteToUser._id,
                    toRoleId: inviteToRole._id,
                    horseId: inviteToHorse._id
                },
                loggedInUser
            );
        } catch (e) {
            console.log(e);
        }

        const expectedInsert = {
            userIdentity : expect.objectContaining({ _id: inviteToUser._id }),
            horseIdentity: expect.objectContaining({ _id: inviteToHorse._id }),
            horseRoleId: inviteToRole._id,
            relationshipStatus: UserHorseRelationshipStatus.Pending,
            history: expect.arrayContaining([expect.objectContaining({
                userIdentity: expect.objectContaining({ _id: loggedInUser._id })
            })])
        };
        expect(MockDbConnector.collection.insertOne).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining(expectedInsert)
        );
    });

    it('should should edit existing UserHorseRelationshp after invitation if one already existed', async () => {
        const inviteToHorse = new Horse({ _id: mockId(1) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToHorse);
        const inviteToUser = new User({ _id: mockId(2) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToUser);
        const inviteToRole = new Role({ _id: mockId(5) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteToRole);
        const mockOwnerRole = new Role({ _id: mockId(6) });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockOwnerRole);
        const openInvitations = [];
        MockDbConnector.collection.find.mockReturnValueOnce(new MockCursor(openInvitations));
        const insertedInviteId = mockId(4);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: insertedInviteId });

        const previousHistoryEntry = new HorseUserRelationshipHistory({
            action: UserHorseRelationshipAction.Accept
        });

        const existingRelationship = new UserHorseRelationship({
            _id: mockId(8),
            history: [previousHistoryEntry],
            latest: previousHistoryEntry,
            horseRoleId: mockId(7),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            userIdentity: new UserIdentity({ _id: inviteToUser._id }),
            horseIdentity: new HorseIdentity({ _id: inviteToHorse._id })
        });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(existingRelationship);
        MockDbConnector.collection.findOne.mockResolvedValueOnce(new Role({ _id: existingRelationship.horseRoleId }));

        const loggedInUser = new User({ _id: mockId(3) });
        try {
            await invitationService.createGeneralHorseInvitation(
                {
                    toUserId: inviteToUser._id,
                    toRoleId: inviteToRole._id,
                    horseId: inviteToHorse._id
                },
                loggedInUser
            );
        } catch (e) {
            console.log(e);
        }

        const newHistoryEntry = {
            userIdentity: expect.objectContaining({ _id: loggedInUser._id })
        };
        const expectedUpdate = {
            userIdentity : expect.objectContaining({ _id: inviteToUser._id }),
            horseIdentity: expect.objectContaining({ _id: inviteToHorse._id }),
            horseRoleId: existingRelationship.horseRoleId, // Existing will persist till accepted
            relationshipStatus: existingRelationship.relationshipStatus, // Existing will persist till accepted
            history: expect.arrayContaining([
                expect.objectContaining(previousHistoryEntry),
                expect.objectContaining(newHistoryEntry)
            ])
        };
        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: mockId(8) }),
            expect.objectContaining({ $set: expect.objectContaining(expectedUpdate) }),
            {}
        );
    });

    it('should remove owner role from original owner when transfer is accepted', async () => {
        const inviteToHorse = new Horse({ _id: mockId(1) });
        const inviteToUser = new User({ _id: mockId(2) });
        const inviteFromUser = new User({ _id: mockId(3), profile: new UserProfile()});
        const mockOwnerRole = new HorseRole({ _id: mockId(5) });

        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockOwnerRole);

        const previousHistoryEntry = new HorseUserRelationshipHistory({
            action: UserHorseRelationshipAction.Request
        });
        const existingRelationship = new UserHorseRelationship({
            _id: mockId(7),
            history: [previousHistoryEntry],
            latest: previousHistoryEntry,
            horseRoleId: mockOwnerRole._id,
            relationshipStatus: UserHorseRelationshipStatus.Pending,
            userIdentity: new UserIdentity({ _id: inviteToUser._id }),
            horseIdentity: new HorseIdentity({ _id: inviteToHorse._id })
        });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(existingRelationship);

        // Finding caches to update
        MockDbConnector.collection.findOne.mockResolvedValueOnce(null);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(null);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

        const previousHistoryEntryOwner = new HorseUserRelationshipHistory({
            action: UserHorseRelationshipAction.Accept
        });
        const existingRelationshipOwner = new UserHorseRelationship({
            _id: mockId(8),
            history: [previousHistoryEntryOwner],
            latest: previousHistoryEntryOwner,
            horseRoleId: mockOwnerRole._id,
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            userIdentity: new UserIdentity({ _id: inviteFromUser._id }),
            horseIdentity: new HorseIdentity({ _id: inviteToHorse._id })
        });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(existingRelationshipOwner);

        // Finding caches to update
        MockDbConnector.collection.findOne.mockResolvedValueOnce(null);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
        MockDbConnector.collection.findOne.mockResolvedValueOnce(null);
        MockDbConnector.collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

        MockDbConnector.collection.findOne.mockResolvedValueOnce(inviteFromUser);
        MockMailService.send.mockResolvedValueOnce(false);

        const loggedInUser = inviteToUser;
        const invitation = new Invitation({
            // "_id" : new ObjectId("619324ed9c6dc52fa876d4c9"),
            "from" : inviteFromUser.toIdentity(),
            "to" : {
                "email" : "nora@riafox.com",
                "userIdentity" : inviteToUser.toIdentity()
            },
            "horseIdentity" : inviteToHorse.toIdentity(),
            "horseRoleIdentity" : mockOwnerRole.toIdentity(),
            "invitationStatus" : InvitationStatus.Sent,
            "invitationType" : InvitationType.OwnershipTransfer
        });
        try {
            await invitationService.acceptOwnershipTransferInvitation(
                invitation,
                loggedInUser
            );
        } catch (e) {
            console.log(e);
        }

        const newHistoryEntry = {
            userIdentity: expect.objectContaining({ _id: loggedInUser._id }),
            action: UserHorseRelationshipAction.Remove
        };
        const expectedUpdate = {
            userIdentity : expect.objectContaining({ _id: inviteFromUser._id }),
            horseIdentity: expect.objectContaining({ _id: inviteToHorse._id }),
            horseRoleId: mockOwnerRole._id,
            relationshipStatus: UserHorseRelationshipStatus.Removed,
            history: expect.arrayContaining([
                expect.objectContaining({action: UserHorseRelationshipAction.Accept}),
                expect.objectContaining(newHistoryEntry)
            ])
        };
        // Updates go...
        // 1 Invite
        // 2 HorseUserRelation of new owner 
        // 3 add relation to horse to user cache new owner 
        // 4 add relation to user to horse cache new owner 
        // 5+ repeat steps 2-4 for new owner
        expect(MockDbConnector.collection.updateOne).toHaveBeenNthCalledWith(
            5,
            expect.objectContaining({ _id: mockId(8) }),
            expect.objectContaining({ $set: expect.objectContaining(expectedUpdate) }),
            {}
        );
    });

    
    it('should add user detailis to invite if they exist', async () => {
        const invites = [
            {
                "from" : {
                    "label" : "Ben Whitaker",
                    "_id" : new ObjectId("60de4aaa4623421450ec8411"),
                    "picture" : {
                        "path" : "media/d000bee1-253b-45bb-91f2-417e820ecd6b",
                        "name" : "hip2.jpg",
                        "type" : "[MediaDocumentType] Image",
                        "jwPlayerId" : "",
                        "url" : "",
                        "safeUrl" : null
                    }
                },
                "to" : {
                    "email" : "test@riafox.com@gmail.com",
                    "userIdentity" : {
                        "label" : "Test person",
                        "_id" : mockId(1),
                        "picture" : null
                    }
                },
                "horseIdentity" : {
                    "label" : "Aardvark",
                    "_id" : new ObjectId("6100a78d5f635611f95d22b2"),
                    "picture" : null
                },
                "horseRoleIdentity" : {
                    "label" : "Student",
                    "_id" : new ObjectId("6131fa9fd5009c3a9218a968"),
                    "picture" : null
                },
                "invitationStatus" : "[InvitationStatus] sent",
                "invitationType" : "[InvitationType] general"
            },
            {
                "from" : {
                    "label" : "Ben Whitaker",
                    "_id" : new ObjectId("60de4aaa4623421450ec8411"),
                    "picture" : {
                        "path" : "media/d000bee1-253b-45bb-91f2-417e820ecd6b",
                        "name" : "hip2.jpg",
                        "type" : "[MediaDocumentType] Image",
                        "jwPlayerId" : "",
                        "url" : "",
                        "safeUrl" : null
                    }
                },
                "to" : {
                    "email" : "external@gmail.com",
                    "userIdentity" : null
                },
                "horseIdentity" : {
                    "label" : "Aardvark",
                    "_id" : new ObjectId("6100a78d5f635611f95d22b2"),
                    "picture" : null
                },
                "horseRoleIdentity" : {
                    "label" : "Student",
                    "_id" : new ObjectId("6131fa9fd5009c3a9218a968"),
                    "picture" : null
                },
                "invitationStatus" : "[InvitationStatus] sent",
                "invitationType" : "[InvitationType] general"
            }
        ];
        // Get invites
        MockDbConnector.collection.find.mockReturnValueOnce(new MockCursor(invites));
        // Get users invits are to
        const users = [
            new User({
                _id: mockId(1),
                profile: new UserProfile({
                    phone: '5556667777',
                    address: new Address({
                        line1: 'addy line 1'
                    })
                })
            })
        ];
        MockDbConnector.collection.find.mockReturnValueOnce(new MockCursor(users))

        const res = await invitationService.getInvitationDetailedListByHorseId(new ObjectId(), false);
        const entryWithUser = res[0];
        const entryWithoutUser = res[1];
        expect(entryWithUser.toUserPhone).toBe('5556667777');
        expect(entryWithUser.toUserAddress.line1).toBe('addy line 1');
        expect(entryWithoutUser.toUserPhone).toBeFalsy();
        expect(entryWithoutUser.toUserAddress).toBeFalsy();

    });


});
