import { Horse, HorseForRide, HorseProfileStatus, Privacy, HorseProfile, User, UserHorseRelationshipAction, UserHorseRelationshipStatus, UserProfile, HorsePermission, Gait, HorseVeterinarianProfile, HorseHealthType } from '@caballus/api-common';
import { Test, TestingModule } from '@nestjs/testing';
import { HorseDalModule, HorseService, InvitationDalModule } from '@nst-caballus/dal';
import { environment } from '@nst-caballus/env';
import { ObjectId, Status } from '@rfx/njs-db/mongo';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { HorseController } from './horse.controller';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { mockUserToHorseCache } from '../../unit-test-helpers/mock-data/horse-relationship/user-to-horse-cache.mocks';
import { FileModule, FileService, GoogleFileOptions } from '@rfx/nst-file';
import { MockCursor, mockId } from '../../unit-test-helpers/mock-db/mock-db-util';
import { mockHorseForRide } from '../../unit-test-helpers/mock-data/horse/horse-for-ride';
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import { mockUser } from '../../unit-test-helpers/mock-data/user/user.mock';
import { mockRide } from '../../unit-test-helpers/mock-data/ride/ride.mocks';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mockHorseToUserCache } from '../../unit-test-helpers/mock-data/horse-relationship/horse-to-user-cache.mocks';
import { mockOwnerHorseRole, mockStudentHorseRole, mockTrainerHorseRole } from '../../unit-test-helpers/mock-data/role/horse-role.mock';
import { mockHorseVeterinarianProfile } from '../../unit-test-helpers/mock-data/horse/horse-veterinarian-profile';
import { mockHorseHealth, mockHorseHealthDocument } from '../../unit-test-helpers/mock-data/horse/horse-health';

describe('Horse Controller Test', () => {
    let controller: HorseController;
    let horseService: HorseService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HorseController],
            imports: [
                HorseDalModule,
                InvitationDalModule,
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
            .compile();

        controller = module.get<HorseController>(HorseController);
        horseService = module.get<HorseService>(HorseService);
    });

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a horse with just a name', async () => {
        const _id = mockId(3);
        const dto = {
            horses: [
                {
                    _id,
                    profile: new HorseProfile({ commonName: 'Pomello Palamino', privacy: Privacy.defaultPrivacy() }),
                    gaitsKilometersPerHour: Gait.defaultKilometersPerHour()
                }
            ]
        };
        const lUser = mockUser;

        // Find default horse role
        MockDbConnector.collection.findOne.mockResolvedValueOnce({
            _id: mockId(2)
        });

        // Create Horse 
        MockDbConnector.collection.insertOne.mockResolvedValue({
            insertedId: mockId(3)
        });

        // Get existing relation between whorse and user (none)
        MockDbConnector.collection.findOne.mockResolvedValueOnce(null);

        const horseId = await horseService.createHorse(dto.horses[0] as Partial<Horse>, lUser);
        expect(horseId).toBeDefined();
        expect(typeof horseId).toBe('object');
        expect(horseId).toEqual(mockId(3));
        const expectedHorseInsert = {
            '_id': mockId(3),
            'createdDate': expect.any(Date),
            'gaitsKilometersPerHour': Gait.defaultKilometersPerHour(),
            'modifiedDate': expect.any(Date),
            'profile': {
                'breed': undefined,
                'breedOther': undefined,
                'heightMeters': undefined,
                'commonName': 'Pomello Palamino',
                'privacy': Privacy.defaultPrivacy(),
                'profilePicture': undefined,
                'profileStatus': HorseProfileStatus.Active,
                'registrationNumber': undefined,
                'url': undefined,
                'weightKilograms': undefined
            },
            'status': Status.Active
        };

        expect(MockDbConnector.collection.insertOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining(expectedHorseInsert)
        );
    });

    it('should create a UserHorseRelationship when a horse is created', async () => {
        const _id = mockId(3);
        const dto = {
            horses: [
                {
                    _id,
                    profile: { commonName: 'Pomello Palamino' },
                    gaitsKilometersPerHour: Gait.defaultKilometersPerHour()
                }
            ]
        };
        const lUser = mockUser;

        // Find default horse role
        MockDbConnector.collection.findOne.mockResolvedValueOnce({
            _id: mockId(2)
        });

        // Create Horse 
        MockDbConnector.collection.insertOne.mockResolvedValue({
            insertedId: mockId(3)
        });

        // Get existing relation between whorse and user (none)
        MockDbConnector.collection.findOne.mockResolvedValueOnce(null);

        await horseService.createHorses(dto.horses as Partial<Horse>[], lUser);
        const expectedRelationInsert =
        {
            'createdDate': expect.any(Date),
            'history' : expect.arrayContaining([
                expect.objectContaining({
                    'action': UserHorseRelationshipAction.CreateHorse,
                    'date': expect.any(Date),
                    'userIdentity': {
                        '_id': mockUser.toIdentity()._id,
                        'label': mockUser.toIdentity().label,
                        'picture': undefined
                    },
                    'roleIdentity': {"_id": mockId(2), "label": "", "picture": undefined}
                })
            ]),
            'horseIdentity': {
                '_id': mockId(3),
                'label': 'Pomello Palamino',
                'picture': undefined,
            },
            'horseRoleId': mockId(2),
            'latest': {
                'action': UserHorseRelationshipAction.CreateHorse,
                'date': expect.any(Date),
                'userIdentity': {
                    '_id': mockUser.toIdentity()._id,
                    'label': mockUser.toIdentity().label,
                    'picture': undefined,
                },
                'roleIdentity': {"_id": mockId(2), "label": "", "picture": undefined}
            },
            'modifiedDate': expect.any(Date),
            'placeholderUserProfile': undefined,
            'relationshipStatus': UserHorseRelationshipStatus.Connected,
            'status': Status.Active,
            'userIdentity': {
                '_id': mockUser.toIdentity()._id,
                'label': mockUser.toIdentity().label,
                'picture': undefined,
            }
        };

        expect(MockDbConnector.collection.insertOne).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining(expectedRelationInsert)
        );
    });

    it('should only retrieve horses where user has ride permission: getHorsesForRide', async () => {
        // Get logged in user's horse cache
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);
        // Get horses for ride
        MockDbConnector.collection.aggregate.mockResolvedValue(new MockCursor([]));

        await horseService.getHorsesForRide(new ObjectId());

        // Default mockUserToHorseCache has 4 horses, 1 owned
        // Only owned horse should be in match
        const expectedAggQuery = expect.arrayContaining([
            {
                '$match': {
                    '_id': { '$in': [mockId(1)] },
                    'status': 1
                }
            }
        ]);
        expect(MockDbConnector.collection.aggregate).toHaveBeenCalledWith(expectedAggQuery);
    });

    it('should include signed url if horse has profile picture: getHorsesForRide', async () => {
        // Get logged in user's horse cache
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);
        // Get horses for ride
        const mockHorseNoUrl = new HorseForRide({
            ...mockHorseForRide,
            profilePicture: null
        });
        MockDbConnector.collection.aggregate.mockResolvedValue(new MockCursor([mockHorseForRide, mockHorseNoUrl]));
        // Sign urls
        const fakeUrl = 'http://fake.url.com';
        MockFileService.getUrl.mockResolvedValue(fakeUrl);

        const horses = await horseService.getHorsesForRide(new ObjectId());

        expect(horses[0].profilePicture.url).toEqual(fakeUrl);
        expect(horses[1].profilePicture).toBeFalsy();
    });


    it('should return ids of horses on ongoing ride: getOngoingRideHorseIds', async () => {
        // Find ongoing rides by horseIds
        // mockRide has horses with mockId 1 and 2
        MockDbConnector.collection.find.mockReturnValue(new MockCursor([mockRide]));

        const horseIds = await horseService.getOngoingRideHorseIds([
            mockId(1),
            mockId(3)
        ]);
        expect(horseIds).toContainEqual(mockId(1));
        expect(horseIds).not.toContainEqual(mockId(3));
    });

    it('should only retrieve horses where user has view permission: getViewableHorses', async () => {
        // Get logged in user's horse cache
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);
        // Get horses for ride
        MockDbConnector.collection.aggregate.mockResolvedValue(new MockCursor([]));

        await horseService.getViewableHorses(new ObjectId());

        // Mock cache has 2 viewable horses, 2 non viewable
        const expectedAggQuery = expect.arrayContaining([
            {
                '$match': {
                    '_id': { '$in': [mockId(1), mockId(2)] },
                    'status': 1
                }
            }
        ]);
        expect(MockDbConnector.collection.aggregate).toHaveBeenCalledWith(expectedAggQuery);
    });

    it('should throw error if user is not connected to horse: checkUserHasHorsePermission', async () => {
        // Get logged in user's horse cache
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);

        const horseNotConnected = mockId(5);
        await expect(horseService.checkUserHasHorsePermission(new ObjectId(), [horseNotConnected], HorsePermission.HorseView))
            .rejects.toThrow(ForbiddenException);
    });

    it('should throw error if user does not have specific permission for horse: checkUserHasHorsePermission', async () => {
        // Get logged in user's horse cache
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);

        const horseCanOnlyView = mockId(2);
        await expect(horseService.checkUserHasHorsePermission(new ObjectId(), [horseCanOnlyView], HorsePermission.HorseRide))
            .rejects.toThrow(ForbiddenException);
    });

    it('should not throw error if user has specific permission for horse: checkUserHasHorsePermission', async () => {
        // Get logged in user's horse cache
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);

        const horseCanOnlyView = mockId(2);
        const res = await horseService.checkUserHasHorsePermission(new ObjectId(), [horseCanOnlyView], HorsePermission.HorseView);
        expect(res).toBeUndefined();
    });


    it('should correctly categorize owner and studentTrainers: getHorseRelationships', async () => {
        // Get horse's cache
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockHorseToUserCache);
        // Get users from horse's cache
        MockDbConnector.collection.find.mockReturnValue(new MockCursor([
            new User({
                _id: mockHorseToUserCache.summaries[0].userIdentity._id,
                profile: new UserProfile({ firstName: mockHorseToUserCache.summaries[0].userIdentity.label })
            }),
            new User({
                _id: mockHorseToUserCache.summaries[1].userIdentity._id,
                profile: new UserProfile({ firstName: mockHorseToUserCache.summaries[1].userIdentity.label })
            }),
            new User({
                _id: mockHorseToUserCache.summaries[2].userIdentity._id,
                profile: new UserProfile({ firstName: mockHorseToUserCache.summaries[2].userIdentity.label })
            }),
            new User({
                _id: mockHorseToUserCache.summaries[3].userIdentity._id,
                profile: new UserProfile({ firstName: mockHorseToUserCache.summaries[3].userIdentity.label })
            }),
            new User({
                _id: mockHorseToUserCache.summaries[4].userIdentity._id,
                profile: new UserProfile({ firstName: mockHorseToUserCache.summaries[4].userIdentity.label })
            })
        ]));
        // Get roles
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockOwnerHorseRole);
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockStudentHorseRole);
        MockDbConnector.collection.findOne.mockResolvedValueOnce(mockTrainerHorseRole);

        const res = await horseService.getHorseRelationships(new ObjectId(), mockUser);
        expect(res.owner.firstName).toEqual('Owner Oberto');
        expect(res.trainersAndStudents).toHaveLength(2);
    });

    it('Should Get Veterinarian Profile from Horse Model', async () => {
        // Get horse veterinarian profile
        MockDbConnector.collection.findOne.mockResolvedValue({
            veterinarianProfile: mockHorseVeterinarianProfile
        });
        const veterinarianProfile = await horseService.getHorseVeterinarianProfileById(new ObjectId());
        expect(veterinarianProfile.fullName).toEqual(mockHorseVeterinarianProfile.fullName);
        expect(veterinarianProfile.email).toEqual(mockHorseVeterinarianProfile.email);
        expect(veterinarianProfile.phone).toEqual(mockHorseVeterinarianProfile.phone);
    });

    it('Should Update Veterinarian Profile for Horse', async () => {
        MockDbConnector.collection.findOne.mockResolvedValue({
            veterinarianProfile: mockHorseVeterinarianProfile
        });
        const horseId = new ObjectId();
        const veterinarianProfile = new HorseVeterinarianProfile({ fullName: 'test' });
        await horseService.updateHorseVeterinarianProfileById(horseId, veterinarianProfile);
        expect(MockDbConnector.collection.updateOne).toHaveBeenNthCalledWith(1,
            { "_id": horseId, "status": 1 }, { "$currentDate": { "modifiedDate": true }, "$set": { "veterinarianProfile": veterinarianProfile } }, {});
    });

    it('Should Get Horse Health by horse id and document with signed url', async () => {
        const fakeUrl = 'http://fake.url.com';
        MockFileService.getUrl.mockResolvedValue(fakeUrl);
        MockDbConnector.collection.aggregate.mockResolvedValue(new MockCursor(mockHorseHealth));
        const horseHealth = await horseService.getHorseHealthByHorseId(new ObjectId());
        expect(horseHealth.length).toEqual(2);
        expect(horseHealth[0].documents[0].latest.url).toEqual(fakeUrl);
    });

    it('Should Create Horse health entry', async () => {
        await horseService.createHorseHealth(mockUser, {
            _id: new ObjectId(),
            horseId: new ObjectId(),
            notes: 'test',
            date: new Date(),
            horseHealthType: HorseHealthType.Health
        }, []);
        expect(MockDbConnector.collection.insertOne).toBeCalledTimes(1);
    });

    it('Should Update Horse health entry by horse health id', async () => {
        await horseService.editHorseHealth(mockUser, new ObjectId(), {
            notes: 'test',
            date: new Date(),
            horseHealthType: HorseHealthType.Health
        }, []);
        expect(MockDbConnector.collection.updateOne).toBeCalledTimes(1);
    });

    it('Should Delete Horse health by id', async () => {
        const horseHealthId = new ObjectId();
        await horseService.deleteHorseHealthById(horseHealthId);
        // Calling two time for inactive horse health entry and it's documents
        expect(MockDbConnector.collection.updateOne).toBeCalledTimes(2);
    });

    it('Should Delete Horse Health Document by document id', async () => {
        const documentId = new ObjectId();
        await horseService.deleteHorseHealthDocumentById(documentId);
        // Calling one time for inactive given document by document id
        expect(MockDbConnector.collection.updateOne).toBeCalledTimes(1);
    });
});

