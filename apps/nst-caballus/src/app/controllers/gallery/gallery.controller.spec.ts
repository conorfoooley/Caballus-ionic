import { Test, TestingModule } from '@nestjs/testing';
import {  MediaService, MediaDalModule, HorseService, HorseDalModule } from '@nst-caballus/dal';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { FileModule, FileService, GoogleFileOptions } from '@rfx/nst-file';
import { MockCursor, mockId } from '../../unit-test-helpers/mock-db/mock-db-util';
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import { GalleryController } from './gallery.controller';
import { BaseMediaDocument, GalleryCategory, MAX_PINNED_IMAGES, Media, MediaCollectionName, MediaDocumentType } from '@caballus/api-common';
import { BadRequestException } from '@nestjs/common';
import { mockUser } from '../../unit-test-helpers/mock-data/user/user.mock';
import { ObjectId } from '@rfx/nst-db/mongo';
import { mockRfxFile } from '../../unit-test-helpers/mock-data/media/rfx-file.mock';
import { mockUploadedImage, mockUploadedVideo } from '../../unit-test-helpers/mock-data/media/base-media-document.mock';

jest.mock('jwplatform');
jest.mock('image-thumbnail');

describe('Gallery Controller Test', () => {
    let controller: GalleryController;
    let mediaService: MediaService;
    let horseService: HorseService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GalleryController],
            imports: [
                MediaDalModule,
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

        controller = module.get<GalleryController>(GalleryController);
        mediaService = module.get<MediaService>(MediaService);
        horseService = module.get<HorseService>(HorseService)
    });

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should throw error if selected media does not belong to horse: pinGalleryImage', async () => {
        // Get media to be pinned
        MockDbConnector.collection.findOne.mockResolvedValue(new Media({
            collectionId: mockId(1)
        }));

        await expect(mediaService.pinGalleryImage(mockId(2), new ObjectId()))
            .rejects.toThrow(BadRequestException);
    });

    it('should throw error if too many images are pinned and no replacement is given: pinGalleryImage', async () => {
        // Get media to be pinned
        MockDbConnector.collection.findOne.mockResolvedValue(new Media({
            collectionId: mockId(1)
        }));

        // Get existing pins
        const pins = [];
        while (pins.length < MAX_PINNED_IMAGES) {
            pins.push(new Media());
        }

        MockDbConnector.collection.find.mockReturnValue(new MockCursor(pins));

        await expect(mediaService.pinGalleryImage(mockId(1), new ObjectId()))
            .rejects.toThrow(BadRequestException);
    });

    
    it('should not error if max images are pinned but replacement is given: pinGalleryImage', async () => {
        // Get media to be pinned
        MockDbConnector.collection.findOne.mockResolvedValue(new Media({
            collectionId: mockId(1)
        }));

        // Get existing pins
        const mediaToReplaceId = mockId(3);
        const pins = [new Media({
            _id: mediaToReplaceId
        })];
        while (pins.length < MAX_PINNED_IMAGES) {
            pins.push(new Media());
        }

        MockDbConnector.collection.find.mockReturnValue(new MockCursor(pins));

        await expect(mediaService.pinGalleryImage(mockId(1), new ObjectId(), mediaToReplaceId))
            .resolves.toBe(undefined);
    });

    it('should remove pin from selected pin to replace if given: pinGalleryImage', async () => {
        // Get media to be pinned
        MockDbConnector.collection.findOne.mockResolvedValue(new Media({
            collectionId: mockId(1)
        }));

        // Get existing pins
        const mediaToReplaceId = mockId(3);
        const pins = [new Media({
            _id: mediaToReplaceId
        })];
        while (pins.length < MAX_PINNED_IMAGES) {
            pins.push(new Media());
        }

        MockDbConnector.collection.find.mockReturnValue(new MockCursor(pins));

        await mediaService.pinGalleryImage(mockId(1), new ObjectId(), mediaToReplaceId);

        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledTimes(2);

        const expectedQuery = { _id: mediaToReplaceId };
        const expectedUpdate = { $set: expect.objectContaining({
            galleryCategory: GalleryCategory.General
        })};
        expect(MockDbConnector.collection.updateOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining(expectedQuery),
            expect.objectContaining(expectedUpdate),
            {}
        );
    });

    it('should add pin to selected media: pinGalleryImage', async () => {
        // Get media to be pinned
        MockDbConnector.collection.findOne.mockResolvedValue(new Media({
            collectionId: mockId(1)
        }));

        // Get existing pins
        MockDbConnector.collection.find.mockReturnValue(new MockCursor([]));

        const mediaToPin = mockId(4);
        await mediaService.pinGalleryImage(mockId(1), mediaToPin);

        expect(MockDbConnector.collection.updateOne).toHaveBeenCalledTimes(1);

        const expectedQuery = { _id: mediaToPin };
        const expectedUpdate = { $set: expect.objectContaining({
            galleryCategory: GalleryCategory.Pinned
        })};
        expect(MockDbConnector.collection.updateOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining(expectedQuery),
            expect.objectContaining(expectedUpdate),
            {}
        );
    });

    it('should upload images with thumbnail: uploadGalleryMedia', async () => {
        const lUser = mockUser;

        MockFileService.uploadFile.mockResolvedValue(mockRfxFile);
        MockDbConnector.collection.insertOne.mockResolvedValue({insertedId: new ObjectId()})
        
        const imageThumbnail = require('image-thumbnail');
        imageThumbnail.mockImplementation(() => {return Buffer.from('mockBuffer')});

        const horseId = mockId(1);
        await mediaService.uploadGalleryMedia(horseId, {imageId: new ObjectId(), videoId: null}, mockUploadedImage, null, lUser);

        const expectedMediaInsert: Partial<Media> = {
            collection: MediaCollectionName.Horse,
            collectionId: horseId,
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
            uploadedBy: mockUser.toIdentity(),
            galleryCategory: GalleryCategory.General
        };

        expect(MockDbConnector.collection.insertOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedMediaInsert)
        );

    });

    it('should upload video: uploadGalleryMedia', async () => {
        const lUser = mockUser;

        MockDbConnector.collection.insertOne.mockResolvedValue({insertedId: new ObjectId()})

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
        
        const horseId = mockId(1);

        await mediaService.uploadGalleryMedia(horseId, {imageId: null, videoId: new ObjectId()}, null, mockUploadedVideo, lUser);

        expect(JWPlatformAPI).toHaveBeenCalledTimes(1);

        const expectedMediaInsert: Partial<Media> = {
            collection: MediaCollectionName.Horse,
            collectionId: horseId,
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
            uploadedBy: mockUser.toIdentity(),
            galleryCategory: GalleryCategory.General
        };

        expect(MockDbConnector.collection.insertOne).toHaveBeenCalledWith(
            expect.objectContaining(expectedMediaInsert)
        );

    });

});

