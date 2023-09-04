import { RfxFile } from '@rfx/njs-file';

export const mockRfxFile: RfxFile = new RfxFile({
    name: 'mockFile.jpg',
    path: 'mock/path',
    contentType: 'image/jpg',
    createdDate: new Date()
});
