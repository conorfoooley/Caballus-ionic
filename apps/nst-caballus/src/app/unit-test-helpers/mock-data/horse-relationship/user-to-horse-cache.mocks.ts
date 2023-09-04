import { HorseIdentity, UserHorseRelationshipStatus, UserIdentity, UserToHorseCache, UserToHorseSummary } from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { mockId } from '../../mock-db/mock-db-util';
import { mockCannotViewHorseRole, mockOwnerHorseRole, mockViewOnlyHorseRole } from '../role/horse-role.mock';

export const mockUserToHorseCache: UserToHorseCache = new UserToHorseCache({
    userIdentity: new UserIdentity({
        _id: new ObjectId(),
        label: 'Big Ol Dan Sr.'
    }),
    summaries : [
        new UserToHorseSummary({
            horseIdentity: new HorseIdentity({
                _id: mockId(1),
                label: 'Big Ol Dan Jr.'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockOwnerHorseRole
        }),
        new UserToHorseSummary({
            horseIdentity: new HorseIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(2),
                label: 'Not My Nelly'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockViewOnlyHorseRole
        }),
        new UserToHorseSummary({
            horseIdentity: new HorseIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(3),
                label: 'Pending Pony'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Pending,
            horseRoleReference: null
        }),
        new UserToHorseSummary({
            horseIdentity: new HorseIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(4),
                label: 'Weird Role Test'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockCannotViewHorseRole
        })
    ]
});
