import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
    forwardRef
} from '@nestjs/common';
import { ObjectId } from '@rfx/njs-db/mongo';
import {
    Gait,
    getRideKilometersPerGait,
    Horse,
    HorseConnectionSimple,
    HorseForRide,
    HorseOwnerSimple,
    HorsePermission,
    HorseProfileStatus,
    HorseRelationshipsSimple,
    HorseStatTotals,
    MediaDocumentType,
    UploadedFileObject,
    User,
    UserHorseRelationshipStatus,
    HorseHealth,
    HorseHealthSimple,
    Privacy,
    HorseProfilePrivacy,
    HorseSummaryForInvitation,
    Invitation,
    Ride,
    RideHistorySimple,
    HorseBasicProfile,
    HorseToUserCache,
    HorseIdentity
} from '@caballus/api-common';
import { HorseRepository } from './horse.repository';
import { HorseRoleService } from '../horse-role-dal/horse-role.service';
import { HorseToUserCacheRepository } from './horse-to-user-cache.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { MediaService } from '../media-dal/media.service';
import { RideRepository } from './ride.repository';
import { UserRepository } from './user.repository';
import { IdentitySyncService } from '../identity-sync-dal/identity-sync.service';
import { HorseHealthRepository } from './horse-health.repository';
import {
    HorseHealthType,
    HorseVeterinarianProfile,
    MediaCollectionName
} from '@caballus/api-common';
import { UserHorseRelationshipService } from '../user-horse-relationship-dal/user-horse-relationship.service';
import { PaginatedListModel } from '@rfx/common';

@Injectable()
export class HorseService {
    constructor(
        @Inject(forwardRef(() => UserHorseRelationshipService))
        private readonly _userHorseRelationshipService: UserHorseRelationshipService,
        private readonly _horseRepo: HorseRepository,
        private readonly _horseRoleService: HorseRoleService,
        private readonly _horseToUserCache: HorseToUserCacheRepository,
        private readonly _userToHorseCache: UserToHorseCacheRepository,
        private readonly _mediaService: MediaService,
        private readonly _rideRepo: RideRepository,
        private readonly _userRepo: UserRepository,
        private readonly _identitySyncService: IdentitySyncService,
        private readonly _horseHealthRepository: HorseHealthRepository
    ) {}

    /**
     * Gets an active horse by their id
     *
     * @param id
     * @returns The horse or null if not found
     */
    public async getHorseById(id: ObjectId): Promise<Horse> {
        return this._horseRepo.getHorseById(id);
    }

    /**
     * Gets horse summary by id
     *
     * @param id
     * @returns HorseSummaryForInvitation
     */
    public async getHorseInvitationSummaryById(
        id: ObjectId,
        invitation: Invitation
    ): Promise<HorseSummaryForInvitation> {
        const h = await this._horseRepo.getHorseById(id);
        if (!h) {
            throw new NotFoundException('Horse not found');
        }
        if (!!h.profile.profilePicture && !!h.profile.profilePicture.path) {
            h.profile.profilePicture.url = await this._mediaService.getSignedUrl(
                h.profile.profilePicture.path
            );
        }
        return new HorseSummaryForInvitation({
            ...h.profile,
            _id: h._id,
            invitationType: invitation.invitationType,
            invitationFrom: invitation.from,
            invitationToRoleName: invitation.horseRoleIdentity.label
        });
    }

    /**
     * Create a Horse for the logged in user
     * Defaults to HorseProfileStatus.Active and private profile if no values given
     * Defaults creator to the horse's owner
     * Creates UserHorseRelationship and updates/creates relevant horse/user caches
     *
     * @param horse
     * @param lUser logged in user
     * @returns The horse id
     */
    public async createHorse(horse: Partial<Horse>, lUser: User): Promise<ObjectId> {
        const horseRole = await this._horseRoleService.getDefaultCreatorRole();

        const h = new Horse(horse);
        h.profile.profileStatus = h.profile.profileStatus || HorseProfileStatus.Active;

        /*
            _id field is assigned locally by a mobile device
            before horse data is synchronized to the server
        */
        await this._horseRepo.createHorse(h);
        await this._userHorseRelationshipService.updateUserHorseRelationship(
            lUser.toIdentity(),
            h.toIdentity(),
            horseRole,
            UserHorseRelationshipStatus.Connected,
            lUser.toIdentity(),
            true
        );

        return h._id;
    }

    /**
     * Wrapper method for createHorse() to create multiple horses
     *
     * @param horses
     * @param lUser logged in user
     * @returns array horse ids
     */
    public async createHorses(horses: Partial<Horse>[], lUser: User): Promise<ObjectId[]> {
        const ids: ObjectId[] = [];
        for (const h of horses) {
            const id = await this.createHorse(h, lUser);
            ids.push(id);
        }
        return ids;
    }

    /**
     * Gets horses for ride for logged in user
     * Only returns horses user has permission to ride
     * Returns HorseForRide, containing ride summaries for the last 3 rides, most recent first
     * Includes signed url for horse profile picture if available
     *
     * @param lUser logged in user
     * @returns The horse id
     */
    public async getHorsesForRide(lUserId: ObjectId): Promise<HorseForRide[]> {
        const cache = await this._userToHorseCache.getUserToHorseCache(lUserId);
        const canRide =
            cache?.summaries?.filter(
                s =>
                    s.relationshipStatus === UserHorseRelationshipStatus.Connected &&
                    !!s.horseRoleReference &&
                    s.horseRoleReference.permissions.includes(HorsePermission.HorseRide)
            ) || [];
        const horses = await this._horseRepo.getHorsesForRideByIdList(
            canRide.map(s => s.horseIdentity._id)
        );

        for (const h of horses) {
            if (!!h.profilePicture && h.profilePicture.path) {
                h.profilePicture.url = await this._mediaService.getSignedUrl(h.profilePicture.path);
            }
            if (!!h.rides && h.rides.length > 0) {
                for (const ride of h.rides) {
                    if (!!ride.ridePicture && !!ride.ridePicture.path) {
                        ride.ridePicture.url = await this._mediaService.getSignedUrl(
                            ride.ridePicture.path
                        );
                    }
                }
            }
        }

        return horses;
    }

    /**
     * Gets all horses the user has permission to view
     *
     * @param lUser logged in user
     * @returns The horse array
     */
    public async getViewableHorses(lUserId: ObjectId): Promise<Horse[]> {
        const cache = await this._userToHorseCache.getUserToHorseCache(lUserId);
        const canView =
            cache?.summaries?.filter(
                s =>
                    s.relationshipStatus === UserHorseRelationshipStatus.Connected &&
                    !!s.horseRoleReference &&
                    s.horseRoleReference.permissions.includes(HorsePermission.HorseView)
            ) || [];
        const horses = await this._horseRepo.getHorsesWithLastRide(
            canView?.map(s => s.horseIdentity._id) || []
        );

        for (const h of horses) {
            if (!!h.profile.profilePicture && h.profile.profilePicture.path) {
                h.profile.profilePicture.url = await this._mediaService.getSignedUrl(
                    h.profile.profilePicture.path
                );
            }
        }

        return horses;
    }

    /**
     * Get a horse by it's id
     * @param id the id of the horse to get
     * @returns The horse
     */
    public async getHorseBasic(id: ObjectId): Promise<Horse> {
        const horse = await this._horseRepo.getHorseById(id);
        if (!horse) {
            throw new NotFoundException(`Horse not found`);
        }
        return new Horse(horse);
    }

    /**
     * Update a Horse
     *
     * @param id
     * @returns void
     */
    public async updateHorse(id: ObjectId, update: Partial<Horse>): Promise<void> {
        await this._horseRepo.updateHorse(id, update);
    }

    /**
     * Get horses by id list
     *
     * @param ids
     * @returns Array of horses
     */
    public async getHorsesByIdList(ids: ObjectId[]): Promise<Horse[]> {
        return this._horseRepo.getHorsesByIdList(ids);
    }

    /**
     * Delete horses by id list
     *
     * @param ids
     * @returns void
     */
    public async deleteHorsesByIdList(ids: ObjectId[]): Promise<void> {
        return this._horseRepo.deleteHorsesByIdList(ids);
    }

    /**
     * Get all Horses
     *
     * @returns void
     */
    public async getHorses(): Promise<Horse[]> {
        return this._horseRepo.getHorses();
    }

    /**
     * Get horses with ongoing ride by horseIds
     * Returns same horseIds passed in filtered to just those on an ongoing ride
     *
     * @returns ObjectId[]
     */
    public async getOngoingRideHorseIds(horseIds: ObjectId[]): Promise<Ride[]> {
        const ongoingRides = await this._rideRepo.getOngoingRidesByHorseId(horseIds);
        const onRide = [];
        for (const hId of horseIds) {
            const currRide = ongoingRides.find(r => {
                const horseIdsAsString = r.horseIdentities.map(hI => hI._id.toHexString());
                return !!horseIdsAsString.includes(hId.toHexString());
            });
            if (!!currRide) {
                onRide.push(currRide);
                continue;
            }
        }

        return onRide;
    }

    /**
     * Throws error if user does not have permission. Otherwise returns void
     *
     * @param userId
     * @param horseId
     * @param permission
     *
     * @Throws ForbiddenException if not permitted
     */
    public async checkUserHasHorsePermission(
        userId: ObjectId,
        horseIds: ObjectId[],
        permission: HorsePermission
    ): Promise<void> {
        const cache = await this._userToHorseCache.getUserToHorseCache(userId);
        for (const horseId of horseIds) {
            const horseRelationSummary = cache?.summaries?.find(h =>
                h.horseIdentity._id.equals(horseId)
            );
            if (
                !horseRelationSummary ||
                !horseRelationSummary.horseRoleReference.permissions.includes(permission)
            ) {
                throw new ForbiddenException(
                    `User does not have permission to ${HorsePermission.toString(permission)}`
                );
            }
        }
    }

    /**
     * Get horse relationships (owner vs trailers and students) for profile
     *
     * @param horseId
     * @returns HorseRelationshipsSimple
     */
    public async getHorseRelationships(
        horseId: ObjectId,
        lUser: User
    ): Promise<HorseRelationshipsSimple> {
        const cache = await this._horseToUserCache.getHorseToUserCache(horseId);
        const users = await this._userRepo.findUsersByIdList(
            cache?.summaries?.map(s => s.userIdentity._id) || []
        );
        const ownerRole = await this._horseRoleService.getOwnerRole();
        const studentRole = await this._horseRoleService.getStudentRole();
        const trainerRole = await this._horseRoleService.getTrainerRole();

        return this._createHorseRelationshipsSimple(
            horseId,
            cache,
            users,
            ownerRole._id,
            studentRole._id,
            trainerRole._id,
            lUser
        );
    }

    public async getHorseRelationshipsList(
        horseIds: ObjectId[],
        lUser: User
    ): Promise<HorseRelationshipsSimple[]> {
        const ownerRole = await this._horseRoleService.getOwnerRole();
        const studentRole = await this._horseRoleService.getStudentRole();
        const trainerRole = await this._horseRoleService.getTrainerRole();

        const caches = await this._horseToUserCache.getHorseToUserCacheByHorseIdList(horseIds);
        const allUserIds = [];
        for (const c of caches) {
            for (const s of c?.summaries) {
                allUserIds.push(s.userIdentity._id);
            }
        }

        const users = await this._userRepo.findUsersByIdList(allUserIds);

        const res = [];
        for (const hId of horseIds) {
            const hCache = caches.find(c => c.horseIdentity._id.equals(hId));
            res.push(
                await this._createHorseRelationshipsSimple(
                    hId,
                    hCache,
                    users,
                    ownerRole._id,
                    studentRole._id,
                    trainerRole._id,
                    lUser
                )
            );
        }
        return res;
    }

    private async _createHorseRelationshipsSimple(
        horseId: ObjectId,
        horseCache: HorseToUserCache,
        possibleUsersInCache: User[],
        ownerRoleId: ObjectId,
        studentRoleId: ObjectId,
        trainerRoleId: ObjectId,
        lUser: User
    ): Promise<HorseRelationshipsSimple> {
        const res = new HorseRelationshipsSimple({ _id: horseId });

        for (const s of horseCache?.summaries) {
            const user = possibleUsersInCache.find(u => u._id.equals(s.userIdentity._id));
            if (!!s.horseRoleReference) {
                if (s.horseRoleReference._id.equals(ownerRoleId)) {
                    res.owner = new HorseOwnerSimple(user.profile);
                    if (!!res.owner.profilePicture && !!res.owner.profilePicture.path) {
                        res.owner.profilePicture.url = await this._mediaService.getSignedUrl(
                            res.owner.profilePicture.path
                        );
                    }
                } else if (
                    s.horseRoleReference._id.equals(studentRoleId) ||
                    s.horseRoleReference._id.equals(trainerRoleId)
                ) {
                    res.trainersAndStudents.push(new HorseConnectionSimple(user.profile));
                }
            }
        }
        const loggedInUserSummary = horseCache?.summaries?.find(s =>
            s.userIdentity._id.equals(lUser._id)
        );
        res.loggedInUserRole = !!loggedInUserSummary
            ? loggedInUserSummary.horseRoleReference
            : null;

        return res;
    }

    /**
     * Get horse stats for profile
     * Riders was requested to be determined by who currently has permission to ride the horse, not by who has actually taken it on a ride
     */
    public async getHorseStatTotals(horseId: ObjectId): Promise<HorseStatTotals> {
        const totals = await this._rideRepo.getHorseStatTotals(horseId);
        const cache = await this._horseToUserCache.getHorseToUserCache(horseId);
        const riders =
            cache?.summaries?.filter(
                s =>
                    s.relationshipStatus === UserHorseRelationshipStatus.Connected &&
                    s.horseRoleReference.permissions.includes(HorsePermission.HorseRide)
            ) || [];
        totals.totalRiders = riders.length;
        totals.riderNames = riders.map(r => r.userIdentity.label);

        const rides = await this._rideRepo.getCalculatedRidesByHorseId(horseId);
        for (const r of rides) {
            const horseIden = r.horseIdentities.find(h => h._id.equals(horseId));
            const rideGaitTotals = getRideKilometersPerGait(
                r,
                horseIden.gaitsKilometersPerHourSnapshot
            );
            for (const g of Gait.members) {
                totals.totalDistancePerGait[g] += rideGaitTotals[g];
            }
        }

        for (const g of Gait.members) {
            totals.totalDistancePerGait[g] = +totals.totalDistancePerGait[g].toFixed(1);
        }

        return totals;
    }

    /**
     * Gets distance per ride
     * Leaves out all rides where calculated values were overidden
     * (No, manual entries do not affect distance per day. But leaving them out is the rule for the profile in general)
     * @param horseId
     */
    public async getHorseDistancePerRide(
        horseId: ObjectId
    ): Promise<{ date: Date; distanceKilometers: number }[]> {
        const rides = await this._rideRepo.getCalculatedRidesByHorseId(horseId);
        return rides.map(r => ({
            date: r.startDateTime,
            distanceKilometers: r.distanceKilometers
        }));
    }

    public async editProfilePicture(horseId: ObjectId, image: UploadedFileObject): Promise<void> {
        const baseMedia = await this._mediaService.createBaseMediaDocument(
            MediaDocumentType.Image,
            image
        );
        await this._horseRepo.updateHorseProfilePicture(horseId, baseMedia);
        this._identitySyncService.syncHorseIdentities(horseId);
    }

    public async editHorseBio(
        horseId: ObjectId,
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
        await this._horseRepo.updateHorseBio(horseId, bio);
        this._identitySyncService.syncHorseIdentities(horseId);
    }

    public async editHorsePrivacy(
        horseId: ObjectId,
        privacy: {
            overallPrivacy: Privacy;
            bio: Privacy;
            media: Privacy;
            rideHistory: Privacy;
            studentsAndTrainers: Privacy;
            ownerDetails: Privacy;
            gaitTotals: Privacy;
            gaitSettings: Privacy;
            medicalHistory: Privacy;
            performanceEvaluations: Privacy;
            competitions: Privacy;
        }
    ): Promise<void> {
        // Though overallPrivacy being Private essentially makes all other values Private
        // Still retain the selections as they are, since they are displayed as previously selected (but grayed out) in the ui
        await this._horseRepo.updateHorsePrivacy(horseId, new HorseProfilePrivacy(privacy));
    }

    public async toggleHorseProfileStatus(horseId: ObjectId): Promise<HorseProfileStatus> {
        const horse = await this._horseRepo.getHorseById(horseId);
        if (!horse) {
            throw new NotFoundException(`Horse profile not found`);
        }
        const profileStatus =
            horse.profile.profileStatus === HorseProfileStatus.Disabled
                ? HorseProfileStatus.Active
                : HorseProfileStatus.Disabled;
        await this._horseRepo.updateHorseProfileStatus(horseId, profileStatus);
        return profileStatus;
    }

    /**
     * Gets horse veterinarian profile by horse id
     *
     * @param id
     * @returns The horse veterinarian profile or null if not found
     */
    public async getHorseVeterinarianProfileById(id: ObjectId): Promise<HorseVeterinarianProfile> {
        const horse = await this._horseRepo.getHorseById(id);
        return horse.veterinarianProfile;
    }

    /**
     * Update horse veterinarian profile by horse id
     *
     * @param id
     * @param veterinarianProfile
     */
    public async updateHorseVeterinarianProfileById(
        id: ObjectId,
        veterinarianProfile: HorseVeterinarianProfile
    ): Promise<void> {
        const horse = await this._horseRepo.getHorseById(id);
        if (!horse) {
            throw new NotFoundException(`Horse profile not found`);
        }
        await this._horseRepo.updateHorseVeterinarianProfile(id, veterinarianProfile);
    }

    /**
     * Create horse health by horse id
     *
     * @param user
     * @param data
     * @param files
     * @returns Created horse health id
     */
    public async createHorseHealth(
        lUser: User,
        {
            _id,
            horseId,
            notes,
            date,
            horseHealthType
        }: {
            _id: ObjectId;
            horseId: ObjectId;
            notes: string;
            date: Date;
            horseHealthType: HorseHealthType;
        },
        files: UploadedFileObject[]
    ): Promise<ObjectId> {
        const horse = await this._horseRepo.getHorseById(horseId);
        if (!horse) {
            throw new NotFoundException(`Horse profile not found`);
        }
        const horseHealth = new HorseHealth({
            _id,
            notes,
            date,
            horseHealthType,
            horseIdentity: horse.toIdentity()
        });
        const healthId = await this._horseHealthRepository.createHorseHealth(horseHealth);
        const user = await this._userRepo.findUserById(lUser._id);
        if (files?.length) {
            await Promise.all(
                files.map(file =>
                    this._mediaService.createMedia(
                        null,
                        MediaCollectionName.HorseHealth,
                        healthId,
                        MediaDocumentType.Document,
                        file,
                        user.toIdentity()
                    )
                )
            );
        }
        return healthId;
    }

    /**
     * Edit horse health by horse health id
     *
     * @param user
     * @param horseHealthId
     * @param data
     * @param files
     */
    public async editHorseHealth(
        lUser: User,
        horseHealthId: ObjectId,
        data: {
            notes: string;
            date: Date;
            horseHealthType: HorseHealthType;
        },
        files: UploadedFileObject[]
    ): Promise<void> {
        const horseHealth = await this._horseHealthRepository.getHorseHealthById(horseHealthId);
        if (!horseHealth) {
            throw new NotFoundException(`Horse health not found`);
        }
        await this._horseHealthRepository.updateHorseHealth(horseHealthId, data);
        const user = await this._userRepo.findUserById(lUser._id);
        if (files?.length) {
            await Promise.all(
                files.map(file =>
                    this._mediaService.createMedia(
                        null,
                        MediaCollectionName.HorseHealth,
                        horseHealthId,
                        MediaDocumentType.Document,
                        file,
                        user.toIdentity()
                    )
                )
            );
        }
    }

    /**
     * Delete horse health by horse health id
     *
     * @param id
     * @param horseHealthId
     */
    public async deleteHorseHealthById(horseHealthId: ObjectId): Promise<void> {
        await this._horseHealthRepository.deleteHorseHealth(horseHealthId);
        await this._mediaService.deleteMediaByCollectionNameAndId(
            MediaCollectionName.HorseHealth,
            horseHealthId
        );
    }

    /**
     * Delete horse health document by document id
     *
     * @param id
     * @param horseHealthId
     * @param documentId
     */
    public async deleteHorseHealthDocumentById(documentId: ObjectId): Promise<void> {
        await this._mediaService.deleteMedia(documentId);
    }

    /**
     * Get horse health by horse id
     *
     * @param horseId
     */
    public async getHorseHealthByHorseId(horseId): Promise<HorseHealthSimple[]> {
        const horseHealths = await this._horseHealthRepository.getHorseHealthByHorseId(horseId);
        for (const h of horseHealths) {
            for (const document of h.documents) {
                if (document.latest.path) {
                    document.latest.url = await this._mediaService.getSignedUrl(
                        document.latest.path
                    );
                }
            }
        }
        return horseHealths;
    }

    /**
     * Get horse ride history
     */
    public async getRideHistory(
        horseId: ObjectId,
        skipRecord: number
    ): Promise<PaginatedListModel<RideHistorySimple>> {
        const rideList = await this._rideRepo.getRideHistory(horseId, skipRecord);
        for (const h of rideList.docs) {
            if (h?.ridePicture?.path) {
                h.ridePicture.url = await this._mediaService.getSignedUrl(h.ridePicture.path);
            }
            if (h?.medias?.length) {
                for (const media of h.medias) {
                    if (media?.thumbnail.path) {
                        media.thumbnail.url = await this._mediaService.getSignedUrl(
                            media?.thumbnail.path
                        );
                    }
                    if (media?.latest.path) {
                        media.latest.url = await this._mediaService.getSignedUrl(
                            media?.latest.path
                        );
                    }
                }
            }
        }
        return rideList;
    }

    /**
     * Get horse ride history by user id
     */
    public async getRideHistoryByUserId(
        userId: ObjectId,
        skipRecord: number
    ): Promise<PaginatedListModel<RideHistorySimple>> {
        const rideList = await this._rideRepo.getRideHistoryByUserId(userId, skipRecord);
        for (const h of rideList.docs) {
            if (h?.ridePicture?.path) {
                h.ridePicture.url = await this._mediaService.getSignedUrl(h.ridePicture.path);
            }
            if (h?.medias?.length) {
                for (const media of h.medias) {
                    if (media?.thumbnail.path) {
                        media.thumbnail.url = await this._mediaService.getSignedUrl(
                            media?.thumbnail.path
                        );
                    }
                    if (media?.latest.path) {
                        media.latest.url = await this._mediaService.getSignedUrl(
                            media?.latest.path
                        );
                    }
                }
            }
        }
        return rideList;
    }

    /**
     * Get horse basic horse profile by id if public profile
     *
     * @param id
     */
    public async getBasicHorseProfile(id: ObjectId): Promise<HorseBasicProfile> {
        const horse = await this._horseRepo.getHorseById(id);
        if (!horse) {
            throw new NotFoundException(`Horse profile not found`);
        }
        if (
            horse.profile.privacy.overallPrivacy !== Privacy.Private ||
            horse.profile.privacy.bio === Privacy.Private
        ) {
            return null;
        }
        const profile = horse.profile;
        return new HorseBasicProfile(profile);
    }

    /**
     * Get horse share profile
     */
    public async shareHorseProfile({
        id,
        title,
        description,
        desktopUrl,
        image
    }: {
        id: ObjectId;
        title: string;
        description: string;
        desktopUrl: string;
        image: string;
    }): Promise<string> {
        return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <meta name="description" content="${description}" />
                <meta property="og:title" content="${title}" />
                <meta property="og:url" content="${desktopUrl}/" />
                <meta property="og:description" content="${description}" />
                <meta property="og:image" content="${image}" />
                <link rel="shortcut icon" href="${image}" type="image/x-icon" />
            </head>
            <script>
                window.location = '${desktopUrl}'
            </script>
            <body>
                <h1>${title}</h1>
                <p>${description}</p>
                ${desktopUrl}
            </body>
        </html>
        `;
    }

    public async getRideById(rideId: ObjectId): Promise<RideHistorySimple> {
        const r = await this._rideRepo.getRideById(rideId);
        if (r?.ridePicture?.path) {
            r.ridePicture.url = await this._mediaService.getSignedUrl(r.ridePicture.path);
        }
        if (r?.medias?.length) {
            for (const media of r.medias) {
                if (media?.thumbnail.path) {
                    media.thumbnail.url = await this._mediaService.getSignedUrl(
                        media?.thumbnail.path
                    );
                }
                if (media?.latest.path) {
                    media.latest.url = await this._mediaService.getSignedUrl(media?.latest.path);
                }
            }
        }
        return r;
    }

    /**
     * Method for follow or un follow a horse by user
     * @param horseId following un-following horse id
     * @param userId logged in user id
     * @returns
     */
    public async followUnfollowHorse(
        horseId: ObjectId,
        userId: ObjectId
    ): Promise<HorseIdentity[]> {
        const horse = await this._horseRepo.getHorseById(horseId);
        const followedHorses = await this._userRepo.followUnfollowHorseByUserId(
            userId,
            horse.toIdentity()
        );
        return followedHorses;
    }

    /**
     * Method for check horse followed by a horse by user
     * @param horseId following un-following horse id
     * @param userId logged in user id
     * @returns
     */
    public async isHorseFollowed(horseId: ObjectId, userId: ObjectId): Promise<boolean> {
        const isFollowed = await this._userRepo.isHorseFollowed(userId, horseId);
        return isFollowed;
    }

    /**
     * Get all followed user of a horse
     * @param horseId following horse id
     * @returns users who followed that horse
     */
    public async getFollowedUsersByHorseId(horseId: ObjectId): Promise<User[]> {
        const users = await this._userRepo.getFollowedUsersByHorseId(horseId);
        return users;
    }
}
