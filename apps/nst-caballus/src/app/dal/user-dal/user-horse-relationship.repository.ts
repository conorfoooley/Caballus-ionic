import { Injectable } from '@nestjs/common';
import { match, MongoCollectionName, MongoRepository, ObjectId, project } from '@rfx/nst-db/mongo';
import { SortDirection, Status } from '@rfx/common';
import {
    HorseDetails,
    HorseProfileStatus,
    UserHorseRelationshipStatus
} from '@caballus/api-common';
import { pipe } from 'rxjs';
import { emptyStage, sort, unwind } from '@rfx/njs-db/mongo';

@MongoCollectionName('userHorseRelationship')
@Injectable()
export class UserHorseRelationshipRepository extends MongoRepository {
    public async getEnabledHorses(userId: ObjectId): Promise<any> {
        const collection = await this.getCollection();
        const originalMatch = {
            'userIdentity._id': userId,
            relationshipStatus: UserHorseRelationshipStatus.Connected,
            status: Status.Active
        };
        const pipeline = pipe(
            match(originalMatch),
            emptyStage({
                $lookup: {
                    from: 'horse',
                    let: { horseId: '$horseIdentity._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: ['$_id', '$$horseId']
                                        },
                                        {
                                            $eq: ['$status', Status.Active]
                                        },
                                        {
                                            $eq: [
                                                '$profile.profileStatus',
                                                HorseProfileStatus.Active
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: 'horse'
                }
            }),
            unwind({
                path: '$horse',
                preserveNullAndEmptyArrays: false
            }),
            sort({
                'horse.createdDate': SortDirection.Ascending
            }),
            project({
                'horse._id': 1,
            })
        )([]);
        const aggCursor = await collection.aggregate<HorseDetails>(pipeline);
        return await aggCursor.toArray();
    }
}
