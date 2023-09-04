import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { AuthDalModule } from '../auth-dal/auth-dal.module';
import { RoleRepository } from './role.repository';
import { MediaDalModule } from '../media-dal/media-dal.module';
import { IdentitySyncDalModule } from '../identity-sync-dal/identity-sync-dal.module';
import { ServicesModule } from '@nst-caballus/library';
import { UserHorseRelationshipRepository } from './user-horse-relationship.repository';
import { HorseRepository } from './horse.repository';

@Module({
    imports: [AuthDalModule, MediaDalModule, IdentitySyncDalModule, ServicesModule],
    providers: [UserService, UserRepository, RoleRepository, UserHorseRelationshipRepository, HorseRepository],
    exports: [UserService]
})
export class UserDalModule {}
