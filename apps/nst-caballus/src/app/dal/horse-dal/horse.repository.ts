import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    stringLike,
    MongoCollectionName,
    UpdateParams,
    numberMatch,
    boolMatch,
    emptyCondition,
    match
} from '@rfx/nst-db/mongo';
import { SortDirection, Status } from '@rfx/common';
import {
    BaseMediaDocument,
    Horse,
    HorseDetails,
    HorseForRide,
    HorseProfileStatus,
    HorseVeterinarianProfile,
    HorseProfilePrivacy,
    RideStatus
} from '@caballus/api-common';
import { pipe } from 'rxjs';
import { GridParams, PaginatedList } from '@rfx/common';
import { MapClass } from '@rfx/nst-common';
import { emptyStage, lookup, project, sort, unwind } from '@rfx/njs-db/mongo';

@MongoCollectionName('horse')
@Injectable()
export class HorseRepository extends MongoRepository {
    /**
     * Gets an active horse by their id
     *
     * @param id
     * @returns The horse or null if not found
     */
    @MapClass(Horse)
    public async getHorseById(id: ObjectId): Promise<Horse> {
        return this.findOneById<Horse>(id, new FindParams());
    }

    /**
     * Create a Horse
     *
     * @param id
     * @returns The horse id
     */
    public async createHorse(horse: Partial<Horse>): Promise<ObjectId> {
        return this.create(horse);
    }

    /**
     * Update a Horse
     *
     * @param id
     * @returns void
     */
    public async updateHorse(id: ObjectId, update: Partial<Horse>): Promise<void> {
        await this.updateById(id, update);
    }

    /**
     * Get horses by id list
     *
     * @param ids
     * @returns Array of horses
     */
    @MapClass(Horse)
    public async getHorsesByIdList(ids: ObjectId[]): Promise<Horse[]> {
        const params = new FindParams();
        params.getAllResults(true);
        const res = await this.findByIdList<Horse>(ids, params);
        return res[0];
    }

    /**
     * Delete horses by id list
     *
     * @param ids
     * @returns void
     */
    public async deleteHorsesByIdList(ids: ObjectId[]): Promise<void> {
        const params = new UpdateParams();
        params.updateMultiple = true;
        params.query = pipe(numberMatch('status', Status.Active))([]);
        await this.updateByIdList(ids, { status: Status.InActive }, params);
    }

    /**
     * Delete a Horse
     *
     * @param id
     * @returns void
     */
    public async deleteHorse(id: ObjectId): Promise<void> {
        await this.updateById(id, { status: Status.InActive });
    }

    /**
     * Get all Horses
     *
     * @returns void
     */
    @MapClass(Horse)
    public async getHorses(): Promise<Horse[]> {
        const findParams = new FindParams();
        findParams.getAllResults(true);
        const res = await this.find<Horse>(findParams);
        return res[0];
    }

    public async getHorsesForRideByIdList(horseIds: ObjectId[]): Promise<HorseForRide[]> {
        const collection = await this.getCollection();
        const originalMatch = {
            _id: { $in: horseIds },
            status: Status.Active
        };
        const pipeline = pipe(
            match(originalMatch),
            sort({
                'profile.endDateTime': SortDirection.Descending
            }),
            emptyStage({
                $lookup: {
                    from: 'ride',
                    let: { horseId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$$horseId', '$horseIdentities._id'] }, rideStatus: RideStatus.Complete, category: { $ne: null } } },
                        { $sort: { createdDate: SortDirection.Descending } },
                        { $limit: 3 },
                        {
                            $project: {
                                category: 1,
                                riderName: '$riderIdentity.label',
                                distanceKilometers: 1,
                                notes: 1,
                                ridePicture: 1
                            }
                        }
                    ],
                    as: 'rides'
                }
            }),
            project({
                _id: 1,
                commonName: '$profile.commonName',
                profilePicture: '$profile.profilePicture',
                profileStatus: '$profile.profileStatus',
                gaitsKilometersPerHour: 1,
                rides: 1
            })
        )([]);
        const aggCursor = await collection.aggregate<HorseForRide>(pipeline);
        return await aggCursor.toArray();
    }

    @MapClass(HorseDetails)
    public async getHorsesWithLastRide(horseIds: ObjectId[]): Promise<HorseDetails[]> {
        const collection = await this.getCollection();
        const originalMatch = {
            _id: { $in: horseIds },
            status: Status.Active
        };
        const pipeline = pipe(
            match(originalMatch),
            sort({
                'profile.commonName': SortDirection.Ascending
            }),
            emptyStage({
                $lookup: {
                    from: 'ride',
                    let: { horseId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$$horseId', '$horseIdentities._id'] } } },
                        { $sort: { createdDate: SortDirection.Descending } },
                        { $limit: 1 },
                        {
                            $project: {
                                riderIdentity: 1,
                                startDateTime: 1
                            }
                        }
                    ],
                    as: 'lastRide'
                }
            }),
            project({
                _id: 1,
                profile: 1,
                gaitsKilometersPerHour: 1,
                lastRiderIdentity: { $arrayElemAt: ['$lastRide.riderIdentity', 0] },
                lastRideDate: { $arrayElemAt: ['$lastRide.startDateTime', 0] }
            })
        )([]);
        const aggCursor = await collection.aggregate<HorseDetails>(pipeline);
        return await aggCursor.toArray();
    }

    public async updateHorseProfilePicture(id: ObjectId, image: BaseMediaDocument): Promise<void> {
        await this.updateById(id, { 'profile.profilePicture': image });
    }

    public async updateHorseBio(
        id: ObjectId,
        bio: {
            commonName: string;
            breedOther: string;
            registeredName: string;
            breed: string;
            registrationNumber: string;
            heightMeters: number;
            weightKilograms: number;
        }
    ): Promise<void> {
        await this.updateById(id, {
            'profile.commonName': bio.commonName,
            'profile.breedOther': bio.breedOther,
            'profile.registeredName': bio.registeredName,
            'profile.breed': bio.breed,
            'profile.registrationNumber': bio.registrationNumber,
            'profile.heightMeters': bio.heightMeters,
            'profile.weightKilograms': bio.weightKilograms
        });
    }

    public async updateHorsePrivacy(id: ObjectId, privacy: HorseProfilePrivacy): Promise<void> {
        await this.updateById(id, {
            'profile.privacy': privacy
        });
    }

    public async updateHorseProfileStatus(
        id: ObjectId,
        profileStatus: HorseProfileStatus
    ): Promise<void> {
        await this.updateById(id, {
            'profile.profileStatus': profileStatus
        });
    }

    public async updateHorseVeterinarianProfile(
        id: ObjectId,
        veterinarianProfile: HorseVeterinarianProfile
    ): Promise<void> {
        await this.updateById(id, {
            veterinarianProfile: veterinarianProfile
        });
    }
}
