import { Test, TestingModule } from '@nestjs/testing';
import { HorseDalModule, HorseService, RideDalModule, RideService } from '@nst-caballus/dal';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { RideController } from './ride.controller';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { mockUserToHorseCache } from '../../unit-test-helpers/mock-data/horse-relationship/user-to-horse-cache.mocks';
import { FileModule, FileService, GoogleFileOptions, RfxFile } from '@rfx/nst-file';
import { MockCursor, mockId } from '../../unit-test-helpers/mock-db/mock-db-util';
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import { mockUser } from '../../unit-test-helpers/mock-data/user/user.mock';
import { BadRequestException } from '@nestjs/common';
import { BaseMediaDocument, Gait, MediaCollectionName, MediaDocumentType, RideStatus, Media, UserIdentity, Horse, HorseProfile, HorseIdentityWithGaits } from '@caballus/api-common';
import { mockRide, mockRideDetailsDto } from '../../unit-test-helpers/mock-data/ride/ride.mocks';
import { RideDetailsDto } from './dto/ride-details.dto';
import { Ride } from '@caballus/api-common';
import { mockUploadedImage, mockUploadedVideo } from '../../unit-test-helpers/mock-data/media/base-media-document.mock';
import { mockRfxFile } from '../../unit-test-helpers/mock-data/media/rfx-file.mock';

jest.mock('jwplatform');
jest.mock('image-thumbnail');

describe('Ride Controller Test', () => {
    let controller: RideController;
    let rideService: RideService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RideController],
            imports: [
                RideDalModule,
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
        .compile();

        controller = module.get<RideController>(RideController);
        rideService = module.get<RideService>(RideService);
    });

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create ride and return rideId: create ride', async () => {
        const dto = { _id: mockId(6), startDateTime: new Date('2021-07-20T00:41:24.415Z'), horseIds: [mockId(1)] };
        const lUser = mockUser;

        // Find horses
        MockDbConnector.collection.find.mockReturnValue(new MockCursor([new Horse({
            _id: mockUserToHorseCache.summaries[0].horseIdentity._id,
            gaitsKilometersPerHour: Gait.defaultKilometersPerHour(),
            profile: new HorseProfile({
                commonName: mockUserToHorseCache.summaries[0].horseIdentity.label
            })
        })]));

        // Create Ride 
        MockDbConnector.collection.insertOne.mockResolvedValue({
            insertedId: mockId(6)
        });

        const rideId = await rideService.createRide(dto._id, dto.startDateTime, dto.horseIds, lUser)
        expect(rideId).toBeDefined();
        expect(typeof rideId).toBe('object');
        expect(rideId).toEqual(mockId(6));

        const expectedRideInsert = {
            horseIdentities: [
                new HorseIdentityWithGaits({
                    ...mockUserToHorseCache.summaries[0].horseIdentity,
                    gaitsKilometersPerHourSnapshot: Gait.defaultKilometersPerHour()
                })
            ],
            riderIdentity: mockUser.toIdentity(),
            startDateTime: new Date('2021-07-20T00:41:24.415Z'),
            rideStatus : RideStatus.InProgress
        }
        expect(MockDbConnector.collection.insertOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining(expectedRideInsert)
        ); 
    });

    it('should update end time and status when ride ends: endRide', async () => {
        const lUser = mockUser;
        await rideService.endRide(
            mockId(1),
            {
                endDateTime: new Date('2021-07-18 04:06:53.573Z'),
                startDateTime: null,
                horseIds: null
            },
            lUser
        );

        const expectedRideQuery = {
            _id: mockId(1)
        };
        const expectedRideUpdate = {
            $set: {
                endDateTime: new Date('2021-07-18 04:06:53.573Z'),
                rideStatus : RideStatus.Complete
            }
        }
        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedRideQuery),
            expect.objectContaining(expectedRideUpdate),
            {}
        ); 
    });

    it('should throw BadRequestException if user is not the rider of the ride: updateRideDetails', async () => {
        const lUser = mockUser; // mockId(1)
        const dto = new RideDetailsDto();

        const m = new Ride(mockRide);
        m.riderIdentity._id = mockId(0);
        MockDbConnector.collection.findOne.mockResolvedValue(m);

        await expect(rideService.updateRideDetails(mockId(4), dto.toPartialRideModel(mockRideDetailsDto as any), null, null, lUser))
            .rejects.toThrow(BadRequestException);  
    });

    it('should reformat gait minutes from array to key/val dict format of Ride model: RideDetailsDto.toPartialRideModel', async () => {
        const dto = new RideDetailsDto();
        const mockRide = dto.toPartialRideModel(mockRideDetailsDto as any);

        expect(mockRide.calculatedGaitMinutes[0].metrics).toMatchObject({
            [Gait.Walk] : 30,
            [Gait.Gallop] : null,
            [Gait.Lope] : null,
            [Gait.Trot] : null
        });
    });

    it('should update the ride details: updateRideDetails', async () => {
        const lUser = mockUser;
        const dto = new RideDetailsDto();

        const m = new Ride(mockRide);
        m._id = mockId(4);
        MockDbConnector.collection.findOne.mockResolvedValue(m);

        const mockRideTransformed = dto.toPartialRideModel(mockRideDetailsDto as any);
        await rideService.updateRideDetails(mockId(4), mockRideTransformed, null, null, lUser)

        const expectedRideQuery = {
            _id: mockId(4)
        };

        const expected = new Ride(mockRideTransformed);
        const expectedRideUpdate = {
            $set: expect.objectContaining({
                distanceKilometers: expected.distanceKilometers,
                category: expected.category,
                notes: expected.notes,
                paths: expect.objectContaining(expected.paths),
                calculatedGaitMinutes: expect.objectContaining(expected.calculatedGaitMinutes),
                manualGaitMinutes: expect.objectContaining(expected.manualGaitMinutes)
            })
        }
        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedRideQuery),
            expect.objectContaining(expectedRideUpdate),
            {}
        );
    });

    it('should upload images with thumbnail: updateRideDetails', async () => {
        const lUser = mockUser;
        const dto = new RideDetailsDto();

        const m = new Ride(mockRide);
        m._id = mockId(4);
        MockDbConnector.collection.findOne.mockResolvedValue(m);
        MockFileService.uploadFile.mockResolvedValue(mockRfxFile);
        
        const mockRideTransformed = dto.toPartialRideModel(mockRideDetailsDto as any);
        
        const imageThumbnail = require('image-thumbnail');
        imageThumbnail.mockImplementation(() => {return Buffer.from('mockBuffer')});

        await rideService.updateRideDetails(mockId(4), mockRideTransformed, [mockUploadedImage], null, lUser);

        const expectedMediaInsert: Partial<Media> = {
            collection: MediaCollectionName.Ride,
            collectionId: mockId(4),
            latest: new BaseMediaDocument({
                ...mockRfxFile,
                dateUploaded: expect.any(Date),
                type: MediaDocumentType.Image
            }),
            thumbnail: new BaseMediaDocument({
                name: 'thumbnail_TestImage.jpg',
                dateUploaded: expect.any(Date),
                type: MediaDocumentType.Image,
                path: 'mock/path'
            }),
            uploadedBy: mockUser.toIdentity()

        };

        expect(MockDbConnector.collection.insertOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedMediaInsert)
        );

    });

    it('should upload video: updateRideDetails', async () => {
        const lUser = mockUser;
        const dto = new RideDetailsDto();

        const m = new Ride(mockRide);
        m._id = mockId(4);
        MockDbConnector.collection.findOne.mockResolvedValue(m);

        MockDbConnector.collection.insertOne.mockResolvedValue({insertedId: mockId(6)})

        // Needs to be in same scope as test
        const fs = require('fs');
        const JWPlatformAPI = require('jwplatform');

        const testVidId = 'testJwpId';
        JWPlatformAPI.mockImplementation(() => {
            return {
                upload: () => {
                    return {media: { key: testVidId}}
                }
            };
        });

        jest.spyOn(fs.promises, 'writeFile').mockImplementation(() => {});
        jest.spyOn(fs, 'unlink').mockImplementation(() => {});

        const mockRideTransformed = dto.toPartialRideModel(mockRideDetailsDto as any);
        await rideService.updateRideDetails(mockId(4), mockRideTransformed, null, [mockUploadedVideo], lUser);

        expect(JWPlatformAPI).toHaveBeenCalledTimes(1);

        const expectedMediaInsert: Partial<Media> = {
            collection: MediaCollectionName.Ride,
            collectionId: mockId(4),
            latest: new BaseMediaDocument({
                name: mockUploadedVideo.originalname,
                jwPlayerId: testVidId,
                dateUploaded: expect.any(Date),
                type: MediaDocumentType.Video
            }),
            thumbnail: new BaseMediaDocument({
                name: 'thumbnail_testJwpId',
                dateUploaded: expect.any(Date),
                type: MediaDocumentType.Image,
                url: 'https://cdn.jwplayer.com/v2/media/testJwpId/poster.jpg?width=120'
            }),
            uploadedBy: mockUser.toIdentity()
        };

        expect(MockDbConnector.collection.insertOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedMediaInsert)
        );

    });

    it('should update start and horseIds when ride ends if they are provided: endRide', async () => {
        // Find users's cache of horses
        MockDbConnector.collection.findOne.mockResolvedValue(mockUserToHorseCache);

        const lUser = mockUser;
        await rideService.endRide(
            mockId(1),
            {
                endDateTime: new Date('2021-07-18 04:06:53.573Z'),
                startDateTime: new Date('2021-07-29T00:41:24.415Z'),
                horseIds: [mockId(1)]
            },
            lUser
        );

        const expectedRideQuery = {
            _id: mockId(1)
        };
        const expectedRideUpdate = {
            $set: {
                endDateTime: new Date('2021-07-18 04:06:53.573Z'),
                rideStatus : RideStatus.Complete,
                horseIdentities: [mockUserToHorseCache.summaries[0].horseIdentity],
                startDateTime: new Date('2021-07-29T00:41:24.415Z')
            }
        }
        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedRideQuery),
            expect.objectContaining(expectedRideUpdate),
            {}
        ); 
    });

    it('should update start, end and horseIds when ride ends if they are provided: updateRideDetails', async () => {
        const lUser = mockUser;
        const dto = new RideDetailsDto();

        const m = new Ride(mockRide);
        m._id = mockId(4);
        // Find ride
        MockDbConnector.collection.findOne.mockResolvedValueOnce(m);

        // Find horses
        MockDbConnector.collection.find.mockReturnValue(new MockCursor([new Horse({
            _id: mockUserToHorseCache.summaries[0].horseIdentity._id,
            gaitsKilometersPerHour: Gait.defaultKilometersPerHour(),
            profile: new HorseProfile({
                commonName: mockUserToHorseCache.summaries[0].horseIdentity.label
            })
        })]));

        const mockDtoWithCacheInfo = {
            ...mockRideDetailsDto,
            endDateTime: new Date('2021-09-18 04:06:53.573Z'),
            startDateTime: new Date('2021-09-18T00:41:24.415Z'),
            horseIds: [mockId(1)]
        };

        const mockRideTransformed = dto.toPartialRideModel(mockDtoWithCacheInfo as any);
        await rideService.updateRideDetails(mockId(4), mockRideTransformed, null, null, lUser)

        const expectedRideQuery = {
            _id: mockId(4)
        };

        const expectedRideUpdate = {
            $set: expect.objectContaining({
                endDateTime: new Date('2021-09-18 04:06:53.573Z'),
                startDateTime: new Date('2021-09-18T00:41:24.415Z'),
                horseIdentities: [
                    new HorseIdentityWithGaits({
                        ...mockUserToHorseCache.summaries[0].horseIdentity,
                        gaitsKilometersPerHourSnapshot: Gait.defaultKilometersPerHour(),
                    })
                ],
            })
        }
        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedRideQuery),
            expect.objectContaining(expectedRideUpdate),
            {}
        );
    });

});

