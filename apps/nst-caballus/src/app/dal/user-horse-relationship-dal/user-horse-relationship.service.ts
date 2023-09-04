import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import {
    HorseIdentity,
    HorseRole,
    HorseToUserCache,
    HorseToUserSummary,
    HorseUserRelationshipHistory,
    UserHorseRelationship,
    UserIdentity,
    UserToHorseCache,
    UserToHorseSummary,
    UserHorseRelationshipAction,
    UserHorseRelationshipStatus,
    Privacy,
    Horse
} from '@caballus/api-common';
import { HorseToUserCacheRepository } from './horse-to-user-cache.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { UserHorseRelationshipRepository } from './user-horse-relationship.repository';
import { HorseRoleService } from '../horse-role-dal/horse-role.service';
import { ObjectId } from '@rfx/nst-db/mongo';
import { MediaService } from '../media-dal/media.service';
import { HorseService } from '../horse-dal/horse.service';

@Injectable()
export class UserHorseRelationshipService {
    constructor(
        @Inject(forwardRef(() => HorseService))
        private readonly _horseService: HorseService,
        private readonly _horseToUserCacheRepo: HorseToUserCacheRepository,
        private readonly _userToHorseCacheRepo: UserToHorseCacheRepository,
        private readonly _userHorseRelationshipRepo: UserHorseRelationshipRepository,
        private readonly _horseRoleService: HorseRoleService,
        private readonly _mediaService: MediaService
    ) {}

    public getRelationshipAction(
        newStatus: UserHorseRelationshipStatus
    ): UserHorseRelationshipAction {
        switch (newStatus) {
            case UserHorseRelationshipStatus.Connected:
                return UserHorseRelationshipAction.Accept;
            case UserHorseRelationshipStatus.Rejected:
                return UserHorseRelationshipAction.Reject;
            case UserHorseRelationshipStatus.Pending:
                return UserHorseRelationshipAction.Request;
            case UserHorseRelationshipStatus.Placeholder:
                return UserHorseRelationshipAction.SetPlaceholder;
            case UserHorseRelationshipStatus.Removed:
                return UserHorseRelationshipAction.Remove;
            default:
                throw new BadRequestException(
                    'Unable to determine UserHorseRelationshipAction for ' +
                        UserHorseRelationshipStatus.toString(newStatus)
                );
        }
    }

    public async updateUserHorseRelationship(
        user: UserIdentity,
        horse: HorseIdentity,
        updateHorseRole: HorseRole,
        updateRelationshipStatus: UserHorseRelationshipStatus,
        initiatedBy: UserIdentity,
        isCreatingHorse: boolean = false
    ): Promise<void> {
        const existingRelation = await this._userHorseRelationshipRepo.getUserHorseRelationship(
            user._id,
            horse._id
        );
        const relationHistory = new HorseUserRelationshipHistory({
            userIdentity: initiatedBy,
            roleIdentity: updateHorseRole.toIdentity(),
            date: new Date(),
            action: !!isCreatingHorse
                ? UserHorseRelationshipAction.CreateHorse
                : this.getRelationshipAction(updateRelationshipStatus)
        });

        let finalRelationship: UserHorseRelationship;
        let finalHorseRole: HorseRole;
        if (!existingRelation) {
            const relation = new UserHorseRelationship({
                userIdentity: user,
                horseIdentity: horse,
                horseRoleId: updateHorseRole._id,
                relationshipStatus: updateRelationshipStatus,
                latest: relationHistory,
                history: [relationHistory]
            });
            await this._userHorseRelationshipRepo.createUserHorseRelationship(relation);
            finalRelationship = relation;
            finalHorseRole = updateHorseRole;
        } else {
            existingRelation.latest = relationHistory;
            existingRelation.history.push(relationHistory);

            // Determine if role or status needs to change
            if (
                existingRelation.horseRoleId.equals(updateHorseRole._id) ||
                existingRelation.relationshipStatus === updateRelationshipStatus
            ) {
                // If role or relationStatus is same, update/most recent change trumps existing values
                existingRelation.relationshipStatus = updateRelationshipStatus;
                (existingRelation.horseRoleId = updateHorseRole._id),
                    (finalHorseRole = updateHorseRole);
            } else {
                // If existing role is different than role in update,
                // existing role may persist if the relationshp status of existing role is a higher connection degree
                // e.g. If user was (existing) connected as a student, but (update) invited to be a trainer,
                // their relationship will still primarily be considered 'connected as student'
                // because 'connected' is a higher degree of connection than 'invited'
                const primaryRoleStatus = UserHorseRelationshipStatus.highestStatus(
                    existingRelation.relationshipStatus,
                    updateRelationshipStatus
                );
                if (primaryRoleStatus === updateRelationshipStatus) {
                    // The update/new role has a higher degree of connection, the user's role has changed
                    (existingRelation.horseRoleId = updateHorseRole._id),
                        (existingRelation.relationshipStatus = updateRelationshipStatus);
                    finalHorseRole = updateHorseRole;
                } else {
                    // The update will be noted in the history, but ultimately had no affect on the user's role
                    finalHorseRole = await this._horseRoleService.getHorseRoleById(
                        existingRelation.horseRoleId
                    );
                }
            }

            delete existingRelation.createdDate;
            delete existingRelation.modifiedDate;

            await this._userHorseRelationshipRepo.updateUserHorseRelationship(
                existingRelation._id,
                existingRelation
            );
            finalRelationship = existingRelation;
        }

        await this._syncCachesByUserHorseRelationship(finalRelationship, finalHorseRole);
    }

    /**
     * Sync Caches By Horse Relationship
     *
     * Accepts a newly created or updated UserHorseRelationship
     * Updates the 2 related caches to reflect current state of given UserHorseRelationship
     *
     * @param relation
     * @param horseRole
     * @returns void
     */
    private async _syncCachesByUserHorseRelationship(
        relation: UserHorseRelationship,
        horseRole: HorseRole
    ): Promise<void> {
        const existingHorseCache = await this._horseToUserCacheRepo.getHorseToUserCache(
            relation.horseIdentity._id
        );

        const newHorseSnap = new HorseToUserSummary({
            ...relation,
            horseRoleReference: horseRole
        });
        if (!existingHorseCache) {
            const newHorseCache = new HorseToUserCache({
                horseIdentity: relation.horseIdentity,
                summaries: []
            });
            await this._horseToUserCacheRepo.createHorseToUserCache(newHorseCache);
        } else {
            // There was an existing cache, but there may or may not be an existing relationship between the horse and user
            // Just remove it if there was one, it will be replaced by the updated version
            await this._horseToUserCacheRepo.removeRelation(
                relation.horseIdentity._id,
                relation.userIdentity._id
            );
        }
        await this._horseToUserCacheRepo.addRelation(relation.horseIdentity._id, newHorseSnap);

        const existingUserCache = await this._userToHorseCacheRepo.getUserToHorseCache(
            relation.userIdentity._id
        );
        const newUserSnap = new UserToHorseSummary({
            ...relation,
            horseRoleReference: horseRole
        });
        if (!existingUserCache) {
            const newUserCache = new UserToHorseCache({
                userIdentity: relation.userIdentity,
                summaries: []
            });
            await this._userToHorseCacheRepo.createUserToHorseCache(newUserCache);
        } else {
            // There was an existing cache, but there may or may not be an existing relationship between the horse and user
            // Just remove it if there was one, it will be replaced by the updated version
            await this._userToHorseCacheRepo.removeRelation(
                relation.userIdentity._id,
                relation.horseIdentity._id
            );
        }
        await this._userToHorseCacheRepo.addRelation(relation.userIdentity._id, newUserSnap);
    }

    public async getHorseOwnerById(horseId: ObjectId): Promise<UserIdentity> {
        return this._userHorseRelationshipRepo.getHorseOwner(horseId);
    }

    public async getUserHorseRelationshipByUserId(userId: ObjectId): Promise<UserToHorseCache> {
        return this._userToHorseCacheRepo.getUserToHorseCache(userId);
    }

    public async getViewableHorses(
        userId: ObjectId,
        loggedInUserId: ObjectId
    ): Promise<UserToHorseSummary[]> {
        const relationships = await this._userToHorseCacheRepo.getUserToHorseCache(userId);
        // get the horse ids from the friend/horse relationships
        const horseIds = relationships.summaries.map(summary => summary.horseIdentity._id);
        // get the horse objects from the horse ids
        const friendsHorses = await this._horseService.getHorsesByIdList(horseIds);
        // get all relationships of logged in user with the friend's horses, where the status is connected
        const relationshipsWithFriendsHorses =
            await this._userHorseRelationshipRepo.getUserHorseRelationships(
                loggedInUserId,
                horseIds,
                UserHorseRelationshipStatus.Connected
            );
        // filter the friend's horses to only those that have a relationship with the logged in user OR those that are public
        const viewableHorses: Horse[] = friendsHorses.filter(horse => {
            const hasValidRelationship = relationshipsWithFriendsHorses.some(relationship =>
                relationship.horseIdentity._id.equals(horse._id)
            );
            if (hasValidRelationship || horse.profile.privacy.overallPrivacy === Privacy.Public) {
                return true;
            } else {
                return false;
            }
        });
        // find the summaries for the viewable horses
        const viewableHorseSummaries: UserToHorseSummary[] = viewableHorses.map(horse =>
            relationships.summaries.find(summary => summary.horseIdentity._id.equals(horse._id))
        );

        for (const h of viewableHorseSummaries) {
            if (!!h.horseIdentity.picture && h.horseIdentity.picture.path) {
                h.horseIdentity.picture.url = await this._mediaService.getSignedUrl(
                    h.horseIdentity.picture.path
                );
            }
        }
        return viewableHorseSummaries;
    }
}
