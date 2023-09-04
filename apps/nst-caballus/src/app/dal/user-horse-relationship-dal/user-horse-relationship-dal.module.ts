import { Module, forwardRef } from '@nestjs/common';
import { HorseToUserCacheRepository } from './horse-to-user-cache.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { UserHorseRelationshipRepository } from './user-horse-relationship.repository';
import { UserHorseRelationshipService } from './user-horse-relationship.service';
import { HorseRoleDalModule } from '../horse-role-dal/horse-role-dal.module';
import { MediaService } from '../media-dal/media.service';
import { MediaRepository } from '../media-dal/media.repository';
import { HttpModule } from '@nestjs/axios';
import { HorseDalModule } from '../horse-dal/horse-dal.module';

@Module({
    imports: [HorseRoleDalModule, HttpModule, forwardRef(() => HorseDalModule)],
    providers: [
        UserHorseRelationshipService,
        HorseToUserCacheRepository,
        UserToHorseCacheRepository,
        UserHorseRelationshipRepository,
        MediaService,
        MediaRepository
    ],
    exports: [UserHorseRelationshipService]
})
export class UserHorseRelationshipDalModule {}
