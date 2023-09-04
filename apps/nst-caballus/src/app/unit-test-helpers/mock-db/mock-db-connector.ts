import { Injectable } from '@nestjs/common';
import { DbConnector } from '@rfx/njs-db';
import { Collection } from 'mongodb';
import {jest} from '@jest/globals';

const MockCollection = jest.fn().mockImplementation(() => ({
    aggregate: jest.fn(),
    bulkWrite: jest.fn(),
    count: jest.fn(),
    countDocuments: jest.fn(),
    createIndex: jest.fn(),
    createIndexes: jest.fn(),
    dataSize: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    distinct: jest.fn(),
    drop: jest.fn(),
    dropIndex: jest.fn(),
    dropIndexes: jest.fn(),
    ensureIndex: jest.fn(),
    estimatedDocumentCount: jest.fn(),
    explain: jest.fn(),
    find: jest.fn(),
    findAndModify: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    findOneAndReplace: jest.fn(),
    findOneAndUpdate: jest.fn(),
    getIndexes: jest.fn(),
    getShardDistricution: jest.fn(),
    getShardVersion: jest.fn(),
    hideIndex: jest.fn(),
    insert: jest.fn(),
    insertOne: jest.fn(),
    insertMany: jest.fn(),
    isCapped: jest.fn(),
    latencyStats: jest.fn(),
    mapReduce: jest.fn(),
    reIndex: jest.fn(),
    remove: jest.fn(),
    renameCollection: jest.fn(),
    replaceOne: jest.fn(),
    stats: jest.fn(),
    storageSize: jest.fn(),
    totalIndexSize: jest.fn(),
    totalSize: jest.fn(),
    unhideIndex: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    watch: jest.fn(),
    validate: jest.fn()
}));

@Injectable()
export class MockDbConnector implements DbConnector {
    public static readonly collection: any = new MockCollection();

    public async connect(): Promise<void> {
        // No-op
    }

    public getCollection<T>(_collectionName: string): Collection<T> {
        return MockDbConnector.collection as any;
    }
}
