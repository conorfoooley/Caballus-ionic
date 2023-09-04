import { BaseMediaDocument, MediaDocumentType, UploadedFileObject } from '@caballus/api-common';

export const mockBaseMediaDocument: BaseMediaDocument = new BaseMediaDocument({
    path: 'testPath',
    name: 'test.png',
    type: MediaDocumentType.Image,
    dateUploaded: new Date()
});

export const mockUploadedImage: UploadedFileObject = {
    buffer: Buffer.from('mock'),
    mimetype: 'image/jpeg',
    originalname: 'TestImage.jpg'
};

export const mockUploadedVideo: UploadedFileObject = {
    buffer: Buffer.from('mock'),
    mimetype: 'video/mp4',
    originalname: 'TestVid.mp4'
};

