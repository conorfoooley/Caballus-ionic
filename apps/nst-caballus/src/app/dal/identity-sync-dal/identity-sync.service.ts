import { Injectable } from '@nestjs/common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { HorseToUserCacheRepository } from './horse-to-user-cache.repository';
import { UserHorseRelationshipRepository } from './user-horse-relationship.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { RideRepository } from './ride.repository';
import { UserRepository } from './user.repository';
import { HorseRepository } from './horse.repository';

@Injectable()
export class IdentitySyncService {
    constructor(
        private readonly _horseToUserCacheRepository: HorseToUserCacheRepository,
        private readonly _rideRepository: RideRepository,
        private readonly _userHorseRelationshipRepository: UserHorseRelationshipRepository,
        private readonly _userToHorseCacheRepository: UserToHorseCacheRepository,
        private readonly _userRepository: UserRepository,
        private readonly _horseRepository: HorseRepository
    ) {}


    // Function currently only updates the collections actualy present in the project thus far. More will need added a project progresses
    // Anticipated additions: Form.userIdentity, FormField.userIdentity, FormResponse.userIdentity, TrainingContent.userIdentity,
    // UserUserRelationship.userIdentities[], UserToUserCache.userIdentity/UserToUserCache.snapshots[].userIdentity,
    // Post.userIdentity/Post.postReports[].userIdentity, GroupUserRelationship.userIdentity, UserToGroupCache.userIdentity, GroupToUserSnapshot.userIdentity
    // Like.userIdentity, Tag.userIdentity
    public async syncUserIdentities(id: ObjectId): Promise<void> {
        const u = await this._userRepository.getUserById(id);
        const i = u.toIdentity();

        this._horseToUserCacheRepository.updateUserIdentities(i);
        this._rideRepository.updateUserIdentities(i);
        this._userHorseRelationshipRepository.updateUserIdentities(i);
        this._userToHorseCacheRepository.updateUserIdentities(i);
    }

    // Function currently only updates the collections actualy present in the project thus far. More will need added a project progresses
    // Anticipated additions: Competition.horseIdentity, HorseHealth.horseIdentity, FormResponse.horseIdentity
    public async syncHorseIdentities(id: ObjectId): Promise<void> {
        const h = await this._horseRepository.getHorseById(id);
        const i = h.toIdentity();

        this._horseToUserCacheRepository.updateHorseIdentities(i);
        this._rideRepository.updateHorseIdentities(i);
        this._userHorseRelationshipRepository.updateHorseIdentities(i);
        this._userToHorseCacheRepository.updateHorseIdentities(i);
    }


}
