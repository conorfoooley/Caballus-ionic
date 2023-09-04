import { TestBed } from '@angular/core/testing';
import { MediaCache, MediaCacheKeys, MediaData, MediaMetadata } from './media.cache';
import { HorseCache } from '../horse/horse.cache';
import { StorageService, CapacitorPluginService, ThumbnailService } from '../../services';
import {
    GalleryService,
    GalleryCategory,
    Media,
    BaseMediaDocument,
    PinMediaDto,
    DeleteGalleryMediaDto,
    RideService
} from '@caballus/ui-common';
import { of, Observable, forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';

const MockStorageService = {
    getUserData: jest.fn(),
    setUserData: jest.fn(),
    clearUserData: jest.fn()
};
const MockCapacitorPluginService = {
    networkStatus: jest.fn(),
    getPhoto: jest.fn()
};
const MockThumbnailService = {
    getPhotoThumbnail: jest.fn()
};
const MockGalleryService = {
    uploadImageToHorseGallery: jest.fn(),
    getHorseGalleryMedia: jest.fn(),
    pinMedia: jest.fn()
};
const MockHorseCache = {
    getHorsesForList: jest.fn()
};
const MockRideService = {
    uploadImageToRide: jest.fn()
};
const SMALL_JPG_BASE64 = 'data:image/jpeg;base64,/9j/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z';
const SMALL_JPG_BLOB = base64ImageDataUrlToBlob(SMALL_JPG_BASE64);

function base64ImageDataUrlToBlob(base64: string): Blob {
    // https://stackoverflow.com/questions/27980612/converting-base64-to-blob-in-javascript/27980815
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64
        .split(',')[0]
        .split(':')[1]
        .split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const bytes = new Uint8Array(arrayBuffer);
    for (let _b = 0; _b < byteString.length; ++_b) {
        bytes[_b] = byteString.charCodeAt(_b);
    }
    return new Blob([arrayBuffer], { type: mimeString });
}

describe('MediaCache', () => {
    let mediaCache: MediaCache;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: StorageService, useValue: MockStorageService },
                { provide: CapacitorPluginService, useValue: MockCapacitorPluginService },
                { provide: GalleryService, useValue: MockGalleryService },
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ThumbnailService, useValue: MockThumbnailService },
                { provide: RideService, useValue: MockRideService }
            ]
        });
        mediaCache = TestBed.inject(MediaCache);
        jest.resetAllMocks();
        mediaCache['_imageUrlToBlob'] = (url: string) => of(SMALL_JPG_BLOB);
    });

    it('should create', () => {
        expect(mediaCache).toBeDefined();
    });

    it('should cache a new, unsynced image', done => {
        /*
            _addUnsyncedImageToCache
                _capacitorPluginService.getPhoto
                    _thumbnailService.getPhotoThumbnail
                _setUserImageBlob (full)
                    _storageService.setUserData
                _setUserImageBlob (thumbnail)
                    _storageService.setUserData
                _cachedUnsyncedGalleryImagesMetadata
                    _storageService.getUserData (unsynced gallery metadata)
                _storageService.setUserData (set appended metadata)
        */
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockCapacitorPluginService.getPhoto.mockReturnValueOnce(of({ dataUrl: SMALL_JPG_BASE64 }));
        MockThumbnailService.getPhotoThumbnail.mockReturnValueOnce(of(SMALL_JPG_BASE64));
        MockStorageService.getUserData.mockReturnValueOnce(of(JSON.stringify([])));

        (mediaCache['_addUnsyncedImageToCache'] as (subjectId: string, key: MediaCacheKeys) => Observable<MediaData>)('0', MediaCacheKeys.UnsyncedGalleryImagesMetadata)
            .pipe(take(1)).subscribe(mediaData => {
                const setFullBlobCall = MockStorageService.setUserData.mock.calls[0];
                const setThumbnailBlobCall = MockStorageService.setUserData.mock.calls[1];
                const setMetadataCall = MockStorageService.setUserData.mock.calls[2];
                expect((setFullBlobCall[0] as string).indexOf(MediaCacheKeys.ImageBlobFull)).toBeGreaterThanOrEqual(0);
                expect((setFullBlobCall[1] as Blob).size).toBeGreaterThan(0);
                expect((setFullBlobCall[1] as Blob).type).toBe('image/jpeg');
                expect((setThumbnailBlobCall[0] as string).indexOf(MediaCacheKeys.ImageBlobThumbnail)).toBeGreaterThanOrEqual(0);
                expect((setThumbnailBlobCall[1] as Blob).size).toBeGreaterThan(0);
                expect((setThumbnailBlobCall[1] as Blob).type).toBe('image/jpeg');
                expect(setMetadataCall[0]).toBe(MediaCacheKeys.UnsyncedGalleryImagesMetadata);
                const metadataToBeSet = JSON.parse(setMetadataCall[1]);
                expect(metadataToBeSet).toHaveLength(1);
                expect(metadataToBeSet[0]).toMatchObject({ mediaSubjectId: '0' });
                expect(mediaData.mediaSubjectId).toBe('0');
                expect(mediaData.mediaId).toBeTruthy();
                expect(mediaData.dataUrl).toBe(SMALL_JPG_BASE64);
                done();
            });
    });

    it('should upload an unsynced, cached gallery image', done => {
        /*
            _uploadUnsyncedGalleryImage
                _cachedUnsyncedGalleryImagesMetadata
                    _storageService.getUserData (gallery metadata)
                _getUserImageBlob
                    _storageService.getUserData (full size blob)
                _galleryService.uploadImageToHorseGallery
                _galleryImagesRequiringServerThumbnail
                    _storageService.getUserData (requiring thumbnail)
                _storageService.setUserData (appended requiring thumbnail)
                _migrateMetadata
        */
        (mediaCache['_migrateMetadata'] as () => Observable<void>) = () => of(undefined);
        const galleryMetadata: MediaMetadata[] = [{ mediaSubjectId: '012', mediaId: '345' }];
        const fullSizeBlob: Blob = SMALL_JPG_BLOB;
        const requiringThumbnail: MediaMetadata[] = [];
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(galleryMetadata))
            .mockResolvedValueOnce(fullSizeBlob)
            .mockResolvedValueOnce(JSON.stringify(requiringThumbnail));
        MockGalleryService.uploadImageToHorseGallery.mockReturnValueOnce(of(undefined));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        (mediaCache['_uploadUnsyncedGalleryImage'] as () => Observable<void>)().pipe(take(1)).subscribe(() => {
            expect(MockStorageService.getUserData).toHaveBeenCalledTimes(3);
            expect(MockGalleryService.uploadImageToHorseGallery).toHaveBeenCalledTimes(1);
            const uploadCall = MockGalleryService.uploadImageToHorseGallery.mock.calls[0];
            expect(uploadCall[0]).toBe('012');
            expect(uploadCall[1]).toBe('345');
            expect(uploadCall[2] instanceof Blob).toBe(true);
            expect((uploadCall[2] as Blob).size).toBeGreaterThan(0);
            expect((uploadCall[2] as Blob).type).toBe('image/jpeg');
            const setRequiringThumbnailCall = MockStorageService.setUserData.mock.calls[0];
            const setRequiringThumbnailMetadata: MediaMetadata[] = JSON.parse(setRequiringThumbnailCall[1]);
            expect(setRequiringThumbnailCall[0]).toBe(MediaCacheKeys.GalleryImagesRequiringServerThumbnail);
            expect(setRequiringThumbnailMetadata[0].mediaId).toBe('345');
            expect(setRequiringThumbnailMetadata[0].mediaSubjectId).toBe('012');
            done();
        });
    });

    it('should migrate media metadata from one cache to another', done => {
        /*
            _migrateMetadata
                _storageService.getUserData (get from metadata array)
                _parseMediaMetadata
                _storageService.setUserData (set from array with migrant spliced out)
                _storageService.getUserData (get to metadata array)
                _parseMediaMetadata
                _storageService.setUserData (set to metadata array with migrant appended)
        */
        MockStorageService.setUserData.mockResolvedValue(undefined);
        const fromArray: MediaMetadata[] = [
            { mediaSubjectId: '0', mediaId: '1'},
            { mediaSubjectId: '2', mediaId: '3' }
        ];
        const toArray: MediaMetadata[] = [
            { mediaSubjectId: '4', mediaId: '5' }
        ];
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(fromArray))
            .mockResolvedValueOnce(JSON.stringify(toArray));
        (mediaCache['_migrateMetadata'] as (idx: number, fromKey: MediaCacheKeys, toKey: MediaCacheKeys) => Observable<void>)(0, MediaCacheKeys.UnsyncedGalleryImagesMetadata, MediaCacheKeys.GalleryImageThumbnailsMetadata)
            .pipe(take(1)).subscribe(() => {
                const getFromDataCall = MockStorageService.getUserData.mock.calls[0];
                const setFromDataCall = MockStorageService.setUserData.mock.calls[0];
                const getToDataCall = MockStorageService.getUserData.mock.calls[1];
                const setToDataCall = MockStorageService.setUserData.mock.calls[1];
                expect(getFromDataCall[0]).toBe(MediaCacheKeys.UnsyncedGalleryImagesMetadata);
                expect(setFromDataCall[0]).toBe(MediaCacheKeys.UnsyncedGalleryImagesMetadata);
                expect(getToDataCall[0]).toBe(MediaCacheKeys.GalleryImageThumbnailsMetadata);
                expect(setToDataCall[0]).toBe(MediaCacheKeys.GalleryImageThumbnailsMetadata);
                const setFromArrayTo: MediaMetadata[] = JSON.parse(setFromDataCall[1]);
                const setToArrayTo: MediaMetadata[] = JSON.parse(setToDataCall[1]);
                expect(setFromArrayTo[0].mediaSubjectId).toBe('2');
                expect(setFromArrayTo[0].mediaId).toBe('3');
                expect(setFromArrayTo).toHaveLength(1);
                expect(setToArrayTo[0].mediaSubjectId).toBe('4');
                expect(setToArrayTo[0].mediaId).toBe('5');
                expect(setToArrayTo[1].mediaSubjectId).toBe('0');
                expect(setToArrayTo[1].mediaId).toBe('1');
                expect(setToArrayTo).toHaveLength(2);
                done();
            });
    });

    it('should download the image gallery for a horse', done => {
        /*
            _downloadHorseGalleryImageThumbnailsByHorseId
                _cachedGalleryImageThumbnailsMetadata
                    _storageService.getUserData (gallery metadata)
                _galleryImagesRequiringServerThumbnail
                    _storageService.getUserData (requiring thumbnail)
                _galleryService.getHorseGalleryMedia
                (filter media result to not present or needing thumbnail update)
                for each remaining media
                    _imageUrlToBlob
                    _setUserImageBlob (true)
                        _imageBlobKey
                        _storageService.setUserData (set downloaded thumbnail)
                    _cachedGalleryImageThumbnailsMetadata
                        _storageService.getUserData (current gallery metadata)
                    _storageService.setUserData (updated gallery metadata)
                    _galleryImagesRequiringServerThumbnail
                        _storageService.getUserData (requiring thumbnail)
                    _storageService.setUserData (spliced thumbnail needs)
        */
        // before entering loop
        const existingGalleryMetadata: MediaMetadata[] = [{ mediaId: '0', mediaSubjectId: '0' }, { mediaId: '1', mediaSubjectId: '0' }];
        const requiringThumbnail: MediaMetadata[] = [{ mediaId: '1', mediaSubjectId: '0' }];
        const retrievedGalleryMedia: Media[] = [
            new Media({
                _id: '0',
                collectionId: '0',
                thumbnail: new BaseMediaDocument({ url: 'fake-url-0'})
            }),
            new Media({
                _id: '1',
                collectionId: '0',
                thumbnail: new BaseMediaDocument({ url: 'fake-url-0'})
            }),
            new Media({
                _id: '2',
                collectionId: '0',
                thumbnail: new BaseMediaDocument({ url: 'fake-url-1'})
            })
        ];
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(existingGalleryMetadata))
            .mockResolvedValueOnce(JSON.stringify(requiringThumbnail));
        MockGalleryService.getHorseGalleryMedia.mockReturnValueOnce(of(retrievedGalleryMedia));
        // enter loop
        const blob = SMALL_JPG_BLOB;
        mediaCache['_imageUrlToBlob'] = (url: string): Observable<Blob> => of(blob);
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.getUserData
            // first iteration
            .mockResolvedValueOnce(JSON.stringify(existingGalleryMetadata))
            .mockResolvedValueOnce(JSON.stringify(requiringThumbnail))
            // second iteration
            .mockResolvedValueOnce(JSON.stringify(existingGalleryMetadata))
            .mockResolvedValueOnce(JSON.stringify([]));
        const afterSecondIterationMetadata = [...existingGalleryMetadata, { mediaId: '2', mediaSubjectId: '0' }];

        (mediaCache['_downloadHorseGalleryImageThumbnailsByHorseId'] as (horseId: string) => Observable<void>)('0')
            .pipe(take(1)).subscribe(() => {
                const setFirstIterationBlob = MockStorageService.setUserData.mock.calls[0];
                const setFirstIterationMetadata = MockStorageService.setUserData.mock.calls[1];
                const setFirstIterationRequiringThumbnail = MockStorageService.setUserData.mock.calls[2];
                const setSecondIterationBlob = MockStorageService.setUserData.mock.calls[3];
                const setSecondIterationMetadata = MockStorageService.setUserData.mock.calls[4];

                expect((setFirstIterationBlob[0] as string).indexOf(MediaCacheKeys.ImageBlobThumbnail)).toBeGreaterThanOrEqual(0);
                expect((setFirstIterationBlob[1] as Blob).size).toBeGreaterThan(0);
                expect((setFirstIterationBlob[1] as Blob).type).toBe('image/jpeg');
                expect((setFirstIterationMetadata[0] as string).indexOf(MediaCacheKeys.GalleryImageThumbnailsMetadata)).toBeGreaterThanOrEqual(0);
                expect((setFirstIterationMetadata[1] as string)).toBe(JSON.stringify(existingGalleryMetadata));
                expect((setFirstIterationRequiringThumbnail[0] as string).indexOf(MediaCacheKeys.GalleryImagesRequiringServerThumbnail)).toBeGreaterThanOrEqual(0);
                expect((setFirstIterationRequiringThumbnail[1])).toHaveLength(0)

                expect((setSecondIterationBlob[0] as string).indexOf(MediaCacheKeys.ImageBlobThumbnail)).toBeGreaterThanOrEqual(0);
                expect((setSecondIterationBlob[1] as Blob).size).toBeGreaterThan(0);
                expect((setSecondIterationBlob[1] as Blob).type).toBe('image/jpeg');
                expect((setSecondIterationMetadata[0] as string).indexOf(MediaCacheKeys.GalleryImageThumbnailsMetadata)).toBeGreaterThanOrEqual(0);
                expect((setSecondIterationMetadata[1] as string)).toBe(JSON.stringify(afterSecondIterationMetadata));
                done();
            });
    });

    it('should cache a new, unsynced media pin action', done => {
        /*
            pinHorseMedia
                _allGalleryImagesMetadata
                    _storageService.getUserData (synced)
                    _storageService.getUserData (unsynced)
                _storageService.setUserData (synced)
                _storageService.setUserData (unsynced)
                _unsyncedPinActions
                    _storageService.getUserData (get pin dtos)
                _storageService.setUserData (set pin dtos)
        */
        const syncedGalleryImageMetadata: MediaMetadata[] = [
            { mediaId: '1', mediaSubjectId: '0', galleryCategory: GalleryCategory.Pinned },
            { mediaId: '2', mediaSubjectId: '0' }
        ];
        const unsyncedGalleryImageMetadata: MediaMetadata[] = [
            { mediaId: '3', mediaSubjectId: '0', galleryCategory: GalleryCategory.Pinned },
            { mediaId: '4', mediaSubjectId: '0' }
        ];
        const existingPinDtos: PinMediaDto[] = [{ horseId: '0', mediaToPin: '4' }];
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(syncedGalleryImageMetadata))
            .mockResolvedValueOnce(JSON.stringify(unsyncedGalleryImageMetadata))
            .mockResolvedValueOnce(JSON.stringify(existingPinDtos));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        mediaCache.pinHorseMedia('0', '2', '1').pipe(take(1)).subscribe(() => {
            const setSynced = MockStorageService.setUserData.mock.calls[0];
            const setSyncedTo = JSON.parse(setSynced[1]);
            const setUnsynced = MockStorageService.setUserData.mock.calls[1];
            expect((setSynced[0] as string).indexOf(MediaCacheKeys.GalleryImageThumbnailsMetadata)).toBeGreaterThanOrEqual(0);
            expect((setSyncedTo[1] as MediaMetadata).mediaId).toBe('2');
            expect((setSyncedTo[1] as MediaMetadata).galleryCategory).toBe(GalleryCategory.Pinned);
            expect((setSyncedTo[0] as MediaMetadata).mediaId).toBe('1');
            expect((setSyncedTo[0] as MediaMetadata).galleryCategory).toBe(GalleryCategory.General);
            expect((setUnsynced[0] as string).indexOf(MediaCacheKeys.UnsyncedGalleryImagesMetadata)).toBeGreaterThanOrEqual(0);
            expect((setUnsynced[1])).toBe(JSON.stringify(unsyncedGalleryImageMetadata));
            const setCall = MockStorageService.setUserData.mock.calls[2];
            const setDtosTo = JSON.parse(setCall[1]);
            expect((setCall[0] as string).indexOf(MediaCacheKeys.UnsyncedPinActions)).toBeGreaterThanOrEqual(0);
            expect(setDtosTo[0]).toMatchObject({ horseId: '0', mediaToPin: '4' });
            expect(setDtosTo[1]).toMatchObject({ horseId: '0', mediaToPin: '2', pinnedMediaToReplace: '1'})
            done();
        });
    });

    it('should upload unsynced media pin actions', done => {
        /*
            _uploadUnsyncedPinActions
                _unsyncedPinActions
                    _storageService.getUserData (pin dtos)
                for each dto
                    _galleryService.pinMedia
        */
        const dtos: PinMediaDto[] = [
            { horseId: '0', mediaToPin: '0' },
            { horseId: '0', mediaToPin: '1', pinnedMediaToReplace: '0'}
        ];
        MockStorageService.getUserData.mockResolvedValueOnce(JSON.stringify(dtos));
        MockGalleryService.pinMedia.mockReturnValue(of(undefined));
        (mediaCache['_uploadUnsyncedPinActions'] as () => Observable<void>)().pipe(take(1)).subscribe(() => {
            const getCall = MockStorageService.getUserData.mock.calls[0];
            const firstUploadCall = MockGalleryService.pinMedia.mock.calls[0];
            const secondUploadCall = MockGalleryService.pinMedia.mock.calls[1];
            expect((getCall[0] as string).indexOf(MediaCacheKeys.UnsyncedPinActions)).toBeGreaterThanOrEqual(0);
            expect(firstUploadCall[0]).toMatchObject(dtos[0]);
            expect(secondUploadCall[0]).toMatchObject(dtos[1]);
            done();
        });
    });

    it('should upload a cached, unsynced ride image', done => {
        /*
            _uploadUnsyncedRideImage
                _cachedUnsyncedRideImagesMetadata
                    _storageService.getUserData (ride images metadata)
                _getUserImageBlob
                    _storageService.getUserData (ride image blob)
                _rideService.uploadImageToRide
                _removeUserImageBlob
                    _storageService.clearUserData (clear image blob)
                _cachedUnsyncedRideImagesMetadata
                    _storageService.getUserData (ride images metadata)
                _storageService.setUserData (set unsynced ride images metadata)
        */
        const unsyncedRideImages: MediaMetadata[] = [
            { mediaId: '0', mediaSubjectId: '1' },
            { mediaId: '2', mediaSubjectId: '3' }
        ];
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(unsyncedRideImages))
            .mockResolvedValueOnce(SMALL_JPG_BLOB)
            .mockResolvedValueOnce(JSON.stringify(unsyncedRideImages));
        MockRideService.uploadImageToRide.mockReturnValueOnce(of(undefined));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.clearUserData.mockResolvedValue(undefined);
        (mediaCache['_uploadUnsyncedRideImage'] as () => Observable<void>)().pipe(take(1)).subscribe(() => {
            const getMetaCall = MockStorageService.getUserData.mock.calls[0];
            expect(getMetaCall[0]).toBe(MediaCacheKeys.UnsyncedRideImagesMetadata);
            const getBlobCall = MockStorageService.getUserData.mock.calls[1];
            expect((getBlobCall[0] as string).indexOf(MediaCacheKeys.ImageBlobFull)).toBeGreaterThanOrEqual(0);
            const uploadCall = MockRideService.uploadImageToRide.mock.calls[0];
            expect(uploadCall[0]).toBe(unsyncedRideImages[0].mediaSubjectId);
            expect(uploadCall[1]).toBe(unsyncedRideImages[0].mediaId);
            expect((uploadCall[2] as Blob).size).toBeGreaterThan(0);
            expect((uploadCall[2] as Blob).type).toBe('image/jpeg');
            const getMetaForFilterCall = MockStorageService.getUserData.mock.calls[2];
            expect(getMetaForFilterCall[0]).toBe(MediaCacheKeys.UnsyncedRideImagesMetadata);
            const setMetaAfterFilterCall = MockStorageService.setUserData.mock.calls[0];
            expect(setMetaAfterFilterCall[0]).toBe(MediaCacheKeys.UnsyncedRideImagesMetadata);
            const filteredMeta = JSON.parse(setMetaAfterFilterCall[1]);
            expect(filteredMeta).toHaveLength(1);
            expect(filteredMeta[0]).toMatchObject({ mediaId: '2', mediaSubjectId: '3' });
            done();
        });
    });

    it('should delete a gallery media entry', done => {
        /*
            deleteHorseGalleryMedia
                _cachedGalleryImageThumbnailsMetadata
                    _storageService.getUserData (get synced metadata)
                -IF- found in synced
                    _storageService.setUserData (set spliced metadata)
                    _cachedUnsyncedGalleryMediaToDelete
                        _storageService.getUserData (get unsynced deletes)
                    _storageService.setUserData (pushed new unsynced delete)
                _cachedUnsyncedGalleryImagesMetadata
                -IF- found in unsynced
                    _storageService.setUserData (set unsynced metadata)
                _removeUserImageBlob (x2)
        */
        const syncedImages: MediaMetadata[] = [{ mediaId: '0', mediaSubjectId: '1' }];
        const unsyncedImages: MediaMetadata[] = [];
        const existingDeleteDtos: DeleteGalleryMediaDto[] = [];
        MockStorageService.getUserData
            .mockResolvedValueOnce(JSON.stringify(syncedImages))
            .mockResolvedValueOnce(JSON.stringify(existingDeleteDtos))
            .mockResolvedValueOnce(JSON.stringify(unsyncedImages));
        MockStorageService.setUserData.mockResolvedValue(undefined);
        MockStorageService.clearUserData.mockResolvedValue(undefined);

        mediaCache.deleteHorseGalleryMedia('0', '1').pipe(take(1)).subscribe(() => {
            const getSyncedImagesCall = MockStorageService.getUserData.mock.calls[0];
            expect(getSyncedImagesCall[0]).toBe(MediaCacheKeys.GalleryImageThumbnailsMetadata);
            const setSyncedImagesCall = MockStorageService.setUserData.mock.calls[0];
            expect(setSyncedImagesCall[0]).toBe(MediaCacheKeys.GalleryImageThumbnailsMetadata);
            const setSyncedTo = JSON.parse(setSyncedImagesCall[1]);
            expect(setSyncedTo).toHaveLength(0);
            const getDeletesCall = MockStorageService.getUserData.mock.calls[1];
            expect(getDeletesCall[0]).toBe(MediaCacheKeys.UnsyncedGalleryMediaToDelete);
            const setDeletesCall = MockStorageService.setUserData.mock.calls[1];
            expect(setDeletesCall[0]).toBe(MediaCacheKeys.UnsyncedGalleryMediaToDelete);
            const setDeletesTo = JSON.parse(setDeletesCall[1]);
            expect(setDeletesTo).toHaveLength(1);
            expect(setDeletesTo[0]).toMatchObject({ horseId: '1', mediaId: '0' });
            done();
        });
    });
});
