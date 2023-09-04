import { Module } from '@nestjs/common';
import { HorseRoleService } from './horse-role.service';
import { HorseRoleRepository } from './horse-role.repository';

@Module({
    providers: [
        HorseRoleService,
        HorseRoleRepository
    ],
    exports: [HorseRoleService]
})
export class HorseRoleDalModule {}
