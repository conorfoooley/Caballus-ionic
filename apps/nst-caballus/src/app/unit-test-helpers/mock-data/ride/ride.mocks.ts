import { Gait, HorseIdentity, Ride, RideCategory, UserIdentity, HorseIdentityWithGaits } from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { mockId } from '../../mock-db/mock-db-util';

export const mockRide: Ride = new Ride({
    riderIdentity: new UserIdentity({
        _id: new ObjectId(mockId(1)),
        label: 'Big Ol Dan Sr.'
    }),
    horseIdentities: [
        new HorseIdentityWithGaits({
            _id: mockId(1),
            label: 'Big Ol Dan Jr.'
        }),
        new HorseIdentityWithGaits({
            // tslint:disable-next-line:no-magic-numbers
            _id: mockId(2),
            label: 'Not My Nelly'
        })
    ]
});

// GaitMinutes are formatted slightly different on dto than in Ride model
export const mockRideDetailsDto = {
    // tslint:disable-next-line:no-magic-numbers
    id : mockId(4),
    distanceKilometers : 10,
    category : RideCategory.Trail,
    notes : 'notes notes notes',
    paths : [
        {
            startDateTime : new Date('2021-07-18 04:06:53.573Z'),
            endDateTime : new Date('2021-07-18 04:36:53.573Z'),
            wayPoints : [
                {
                    timestamp : new Date('2021-07-18 04:06:53.573Z'),
                    longitude : 123,
                    latitude : 456
                }
            ]
        }
    ],
    calculatedGaitMinutes : [
        {
            // tslint:disable-next-line:no-magic-numbers
            horseId : mockId(2),
            metrics : [
                {
                    gait : Gait.Walk,
                    metric : 30
                }
            ]
        }
    ],
    manualGaitMinutes : [
        {
            // tslint:disable-next-line:no-magic-numbers
            horseId : mockId(2),
            metrics : [
                {
                    gait : Gait.Walk,
                    metric : 14
                },
                {
                    gait : Gait.Lope,
                    metric : 16
                }
            ]
        }
    ]
};
