import {jest} from '@jest/globals';

const MockService = jest.fn().mockImplementation(() => ({
    getUrl: jest.fn(),
    uploadFile: jest.fn()
}));

export const MockFileService = new MockService();
