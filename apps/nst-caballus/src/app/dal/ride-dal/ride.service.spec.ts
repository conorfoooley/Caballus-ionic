import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RideService } from './ride.service';
import { RideRepository } from './ride.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { HorseRepository } from './horse.repository';
import { MediaService } from '../media-dal/media.service';
import { User, UploadedFileObject, Ride } from '@caballus/api-common';
import { ObjectId } from '@rfx/nst-db/mongo';

const MockRideRepo = {
    getRideById: jest.fn()
};
const MockMediaService = {
    createMedia: jest.fn()
};
const MockUserToHorseCacheRepo = {

};
const MockHorseRepo = {

};

describe('Ride Service', () => {
    let rideService: RideService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                { provide: RideRepository, useValue: MockRideRepo },
                { provide: UserToHorseCacheRepository, useValue: MockUserToHorseCacheRepo },
                { provide: MediaService, useValue: MockMediaService },
                { provide: HorseRepository, useValue: MockHorseRepo },
                RideService
            ]
        }).compile();
        rideService = module.get<RideService>(RideService);
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(rideService).toBeDefined();
    });

    it('should upload ride media', async () => {
        const userId = new ObjectId();
        const user = new User({ _id: userId });
        const rideId = new ObjectId();
        const ride = new Ride({ _id: rideId, riderIdentity: user.toIdentity() });
        const imageId = new ObjectId();
        const videoId = new ObjectId();
        const uploaded: UploadedFileObject = { buffer: Buffer.alloc(0), mimetype: '', originalname: '' };
        MockRideRepo.getRideById.mockResolvedValueOnce(ride);
        MockMediaService.createMedia.mockResolvedValue(undefined);

        await rideService.uploadRideMedia(
            rideId,
            { imageId, videoId },
            user,
            uploaded,
            uploaded
        );

        expect(MockRideRepo.getRideById).toHaveBeenCalledTimes(1);
        const createImageCall = MockMediaService.createMedia.mock.calls[0];
        const createVideoCall = MockMediaService.createMedia.mock.calls[1];
        expect((createImageCall[0] as ObjectId).equals(imageId)).toBe(true);
        expect((createImageCall[2] as ObjectId).equals(rideId)).toBe(true);
        expect((createVideoCall[0] as ObjectId).equals(videoId)).toBe(true);
        expect((createVideoCall[2] as ObjectId).equals(rideId)).toBe(true);
    });

    it('should throw a forbidden expection if wrong user uploads ride media', async () => {
        const userAId = new ObjectId();
        const userBId = new ObjectId();
        const userA = new User({ _id: userAId });
        const userB = new User({ _id: userBId });
        const rideId = new ObjectId();
        const ride = new Ride({ _id: rideId, riderIdentity: userA.toIdentity() });
        const imageId = new ObjectId();
        const videoId = new ObjectId();
        const uploaded: UploadedFileObject = { buffer: Buffer.alloc(0), mimetype: '', originalname: '' };
        MockRideRepo.getRideById.mockResolvedValueOnce(ride);
        MockMediaService.createMedia.mockResolvedValue(undefined);

        try {
            await rideService.uploadRideMedia(
                rideId,
                { imageId, videoId },
                userB,
                uploaded,
                uploaded
            );
            return Promise.reject();
        } catch (e) {
            expect(e instanceof ForbiddenException).toBe(true);
            return Promise.resolve();
        }
    });
});
