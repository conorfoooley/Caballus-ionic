import { HorseIdentity, HorseToUserCache, HorseToUserSummary, UserHorseRelationshipStatus, UserIdentity } from '@caballus/api-common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { mockId } from '../../mock-db/mock-db-util';
import { mockOwnerHorseRole, mockStudentHorseRole, mockTrainerHorseRole, mockViewOnlyHorseRole } from '../role/horse-role.mock';

export const mockHorseToUserCache: HorseToUserCache = new HorseToUserCache({
    horseIdentity: new HorseIdentity({
        _id: new ObjectId(),
        label: 'Big Ol Dan Sr.'
    }),
    summaries : [
        new HorseToUserSummary({
            userIdentity: new UserIdentity({
                _id: mockId(1),
                label: 'Owner Oberto'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockOwnerHorseRole
        }),
        new HorseToUserSummary({
            userIdentity: new UserIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(2),
                label: 'Watcher Willie'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockViewOnlyHorseRole
        }),
        new HorseToUserSummary({
            userIdentity: new UserIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(3),
                label: 'Pending Penelope'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Pending,
            horseRoleReference: null
        }),
        new HorseToUserSummary({
            userIdentity: new UserIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(4),
                label: 'Student Stan'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockStudentHorseRole
        }),
        new HorseToUserSummary({
            userIdentity: new UserIdentity({
                // tslint:disable-next-line:no-magic-numbers
                _id: mockId(5),
                label: 'Trainer Trisha'
            }),
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            horseRoleReference: mockTrainerHorseRole
        })
    ]
});
