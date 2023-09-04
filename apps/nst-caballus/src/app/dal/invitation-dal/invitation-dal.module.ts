import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { HorseRoleDalModule } from '../horse-role-dal/horse-role-dal.module';
import { UserHorseRelationshipDalModule } from '../user-horse-relationship-dal/user-horse-relationship-dal.module';
import { UserRepository } from './user.repository';
import { HorseRepository } from './horse.repository';
import { ServicesModule } from '@nst-caballus/library';

@Module({
    imports: [HorseRoleDalModule, UserHorseRelationshipDalModule, ServicesModule],
    providers: [
        InvitationService,
        InvitationRepository,
        UserRepository,
        HorseRepository
    ],
    exports: [InvitationService]
})
export class InvitationDalModule {}
