import { ObjectId } from '@rfx/njs-db/mongo';

export class MockCursor {
    public data: any[] = [];

    constructor(data: any[]) {
        this.data = data;
    }

    public toArray(): any[] {
        return this.data;
    }
}

const mockIdStrings: string[] = [
    '555555555555555555555550',
    '555555555555555555555551',
    '555555555555555555555552',
    '555555555555555555555553',
    '555555555555555555555554',
    '555555555555555555555555',
    '555555555555555555555556',
    '555555555555555555555557',
    '555555555555555555555558',
    '555555555555555555555559'
];

/** Create an oid for testing
 * Uses defined rather than random strings so can check for equality with exact oid/string values
*/

export function mockId(index: number): ObjectId {
    return new ObjectId(mockIdStrings[index]);
}

