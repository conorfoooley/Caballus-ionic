import { HorseForRide, Gait } from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { mockBaseMediaDocument } from '../media/base-media-document.mock';

export const mockHorseForRide: HorseForRide = new HorseForRide({
    _id: new ObjectId(),
    commonName: 'Big Ol Dan',
    profilePicture: mockBaseMediaDocument,
    gaitsKilometersPerHour: Gait.defaultKilometersPerHour(),
    rides: []
});
