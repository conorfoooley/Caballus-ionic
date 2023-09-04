import { Module, forwardRef } from '@nestjs/common';
import { HorseService } from './horse.service';
import { HorseRepository } from './horse.repository';
import { HorseToUserCacheRepository } from './horse-to-user-cache.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { MediaDalModule } from '../media-dal/media-dal.module';
import { RideRepository } from './ride.repository';
import { UserRepository } from './user.repository';
import { IdentitySyncDalModule } from '../identity-sync-dal/identity-sync-dal.module';
import { HorseRoleDalModule } from '../horse-role-dal/horse-role-dal.module';
import { HorseHealthRepository } from './horse-health.repository';
import { UserHorseRelationshipDalModule } from '../user-horse-relationship-dal/user-horse-relationship-dal.module';

@Module({
    imports: [
        MediaDalModule,
        IdentitySyncDalModule,
        HorseRoleDalModule,
        forwardRef(() => UserHorseRelationshipDalModule)
    ],
    providers: [
        HorseService,
        HorseRepository,
        HorseToUserCacheRepository,
        UserToHorseCacheRepository,
        RideRepository,
        UserRepository,
        HorseHealthRepository
    ],
    exports: [HorseService]
})
export class HorseDalModule {}
