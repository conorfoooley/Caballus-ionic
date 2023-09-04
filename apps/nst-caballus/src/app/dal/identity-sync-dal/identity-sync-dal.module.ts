import { Module } from '@nestjs/common';
import { RideRepository } from './ride.repository';
import { HorseToUserCacheRepository } from './horse-to-user-cache.repository';
import { IdentitySyncService } from './identity-sync.service';
import { UserHorseRelationshipRepository } from './user-horse-relationship.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { UserRepository } from './user.repository';
import { HorseRepository } from './horse.repository';


@Module({
    imports: [],
    providers: [
        IdentitySyncService,
        HorseToUserCacheRepository,
        RideRepository,
        UserHorseRelationshipRepository,
        UserToHorseCacheRepository,
        UserRepository,
        HorseRepository
    ],
    exports: [IdentitySyncService]
})
export class IdentitySyncDalModule {}
