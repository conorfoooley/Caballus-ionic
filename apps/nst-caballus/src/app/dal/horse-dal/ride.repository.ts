import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    MongoCollectionName,
    match,
    project,
    group,
    emptyStage
} from '@rfx/nst-db/mongo';
import {
    Gait,
    HorseStatTotals,
    Ride,
    RideHistorySimple,
    RideStatus,
    RIDE_HISTORY_DEFAULT_FETCH_LIMIT
} from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { pipe } from 'rxjs';
import { PaginatedList, SortDirection, Status } from '@rfx/common';
import { limit, skip, sort } from '@rfx/njs-db/mongo';
import moment from 'moment';

@MongoCollectionName('ride')
@Injectable()
export class RideRepository extends MongoRepository {
    /**
     * Get all ongoing rides by horse id
     *
     * @returns Ride[]
     */
    @MapClass(Ride)
    public async getOngoingRidesByHorseId(horseIds: ObjectId[]): Promise<Ride[]> {
        const findParams = new FindParams();
        findParams.getAllResults(true);
        findParams.query = {
            'horseIdentities._id': { $in: horseIds },
            $or: [{ rideStatus: RideStatus.InProgress, "endDateTime": null  },  { rideStatus: RideStatus.InProgress, "category": null }],
            'startDateTime': {
                $lte: new Date(moment().subtract(1, 'day').format())
            }
        };
        const res = await this.find<Ride>(findParams);
        return res[0];
    }

    @MapClass(HorseStatTotals)
    public async getHorseStatTotals(horseId: ObjectId): Promise<HorseStatTotals> {
        const toMinutes = 60000;
        const collection = await this.getCollection();
        const pipeline = pipe(
            match({
                'horseIdentities._id': horseId,
                status: Status.Active,
                'manualGaitMinutes.horseId': { $ne: horseId }
            }),
            emptyStage({
                $addFields: {
                    filteredCalculatedGaitMinutes: {
                        $filter: {
                            input: '$calculatedGaitMinutes',
                            as: 'cgm',
                            cond: {
                                $eq: ['$$cgm.horseId', horseId]
                            }
                        }
                    }
                }
            }),
            emptyStage({
                $addFields: {
                    horseCalculatedGaitMinutes: {
                        $arrayElemAt: ['$filteredCalculatedGaitMinutes', 0]
                    }
                }
            }),
            project({
                distanceKilometers: 1,
                horseCalculatedGaitMinutes: 1,
                totalMinutes: {
                    $divide: [{ $subtract: ['$endDateTime', '$startDateTime'] }, toMinutes]
                }
            }),
            group('', {
                totalDistanceKilometers: { $sum: '$distanceKilometers' },
                totalRides: { $sum: 1 },
                totalMinutes: { $sum: '$totalMinutes' },
                ...this._getGaitSumGroups()
            }),
            project({
                _id: 1,
                totalDistanceKilometers: 1,
                totalRides: 1,
                totalMinutes: 1,
                averageMinutesPerRide: { $divide: ['$totalMinutes', '$totalRides'] },
                averageKilometersPerRide: { $divide: ['$totalDistanceKilometers', '$totalRides'] },
                ...this._getGaitProjection()
            })
        )([]);
        const aggCursor = await collection.aggregate<HorseStatTotals>(pipeline);
        const totals = (await aggCursor.toArray())[0];
        // A horse without any rides should return a zeroed out totals instance
        return !!totals ? totals : new HorseStatTotals();
    }

    private _getGaitSumGroups(): { [key: string]: { $sum: string } } {
        const groups = {};
        for (const g of Gait.members) {
            groups[`minutesPer${g}`] = { $sum: `$horseCalculatedGaitMinutes.minutes.${g}` };
        }
        return groups;
    }

    private _getGaitProjection(): { [key: string]: 1 } {
        const p = {};
        for (const g of Gait.members) {
            p[`totalMinutesPerGait.${g}`] = `$minutesPer${g}`;
        }
        return p;
    }

    /**
     * Get complete rides by horse id
     *
     * @returns Ride[]
     */
    @MapClass(Ride)
    public async getCalculatedRidesByHorseId(horseId: ObjectId): Promise<Ride[]> {
        const findParams = new FindParams();
        findParams.getAllResults(true);
        findParams.query = {
            'horseIdentities._id': horseId,
            'manualGaitMinutes.horseId': { $ne: horseId }
        };
        findParams.addSortFieldAscending('startDateTime');
        const res = await this.find<Ride>(findParams);
        return res[0];
    }

    /**
     * Get Rides with media detail by horse id
     */

    public async getRideHistory(
        horseId: ObjectId,
        skipRecord: number
    ): Promise<PaginatedList<RideHistorySimple>> {
        const findParams = new FindParams({
            getCount: true,
            query: {
                'horseIdentities._id': horseId,
                'manualGaitMinutes.horseId': { $ne: horseId },
                status: Status.Active
            }
        });
        const collection = await this.getCollection();
        const originalMatch = findParams.query;
        const pipeline = pipe(
            match(originalMatch),
            sort({
                startDateTime: SortDirection.Descending
            }),
            emptyStage({
                $lookup: {
                    from: 'media',
                    let: { rideId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$collectionId', '$$rideId'] },
                                        { $eq: ['$status', Status.Active] },
                                        { $eq: ['$collection', 'ride'] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdDate: SortDirection.Descending } }
                    ],
                    as: 'medias'
                }
            }),
            project({
                _id: 1,
                riderIdentity: 1,
                startDateTime: 1,
                distanceKilometers: 1,
                endDateTime: 1,
                rideStatus: 1,
                category: 1,
                entryType: 1,
                medias: 1,
                notes: 1,
                ridePicture: 1,
                calculatedGaitKilometers: 1,
                calculatedGaitMinutes: 1,
                horseIdentities: 1,
                manualGaitMinutes: 1,
                paths: 1,
                name: 1
            }),
            skip(Number(skipRecord)),
            limit(RIDE_HISTORY_DEFAULT_FETCH_LIMIT)
        )([]);
        const countCursor = collection.find(findParams.query);
        const aggCursor = collection.aggregate<RideHistorySimple>(pipeline);
        return new PaginatedList<RideHistorySimple>(
            [await aggCursor.toArray(), await countCursor.count()],
            RideHistorySimple
        );
    }

     /**
     * Get Rides with media detail by horse id
     */

      public async getRideHistoryByUserId(
        userId: ObjectId,
        skipRecord: number
    ): Promise<PaginatedList<RideHistorySimple>> {
        const findParams = new FindParams({
            getCount: true,
            query: {
                'riderIdentity._id': userId,
                status: Status.Active
            }
        });
        const collection = await this.getCollection();
        const originalMatch = findParams.query;
        const pipeline = pipe(
            match(originalMatch),
            sort({
                startDateTime: SortDirection.Descending
            }),
            emptyStage({
                $lookup: {
                    from: 'media',
                    let: { rideId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$collectionId', '$$rideId'] },
                                        { $eq: ['$status', Status.Active] },
                                        { $eq: ['$collection', 'ride'] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdDate: SortDirection.Descending } }
                    ],
                    as: 'medias'
                }
            }),
            project({
                _id: 1,
                riderIdentity: 1,
                startDateTime: 1,
                distanceKilometers: 1,
                endDateTime: 1,
                rideStatus: 1,
                category: 1,
                entryType: 1,
                medias: 1,
                notes: 1,
                ridePicture: 1,
                calculatedGaitKilometers: 1,
                calculatedGaitMinutes: 1,
                horseIdentities: 1,
                manualGaitMinutes: 1,
                paths: 1,
                name: 1
            }),
            skip(Number(skipRecord)),
            limit(RIDE_HISTORY_DEFAULT_FETCH_LIMIT)
        )([]);
        const countCursor = collection.find(findParams.query);
        const aggCursor = collection.aggregate<RideHistorySimple>(pipeline);
        return new PaginatedList<RideHistorySimple>(
            [await aggCursor.toArray(), await countCursor.count()],
            RideHistorySimple
        );
    }

    /**
     * Get Rides with media detail by horse id
     */

    public async getRideById(rideId: ObjectId): Promise<RideHistorySimple> {
        const findParams = new FindParams({
            getCount: true,
            query: {
                _id: new ObjectId(rideId),
                status: Status.Active
            }
        });
        const collection = await this.getCollection();
        const originalMatch = findParams.query;
        const pipeline = pipe(
            match(originalMatch),
            sort({
                startDateTime: SortDirection.Descending
            }),
            emptyStage({
                $lookup: {
                    from: 'media',
                    let: { rideId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$collectionId', '$$rideId'] },
                                        { $eq: ['$status', Status.Active] },
                                        { $eq: ['$collection', 'ride'] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdDate: SortDirection.Descending } }
                    ],
                    as: 'medias'
                }
            }),
            project({
                _id: 1,
                riderIdentity: 1,
                startDateTime: 1,
                distanceKilometers: 1,
                endDateTime: 1,
                rideStatus: 1,
                category: 1,
                entryType: 1,
                medias: 1,
                notes: 1,
                ridePicture: 1,
                calculatedGaitKilometers: 1,
                calculatedGaitMinutes: 1,
                horseIdentities: 1,
                manualGaitMinutes: 1,
                paths: 1,
                name: 1
            })
        )([]);
        const aggCursor = collection.aggregate<RideHistorySimple>(pipeline);
        return (await aggCursor.toArray())[0];
    }
}
