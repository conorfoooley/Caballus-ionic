import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { HorseRoleDalModule, RoleDalModule } from '@nst-caballus/dal';

@Module({
    controllers: [RoleController],
    imports: [RoleDalModule, HorseRoleDalModule]
})
export class RoleModule {}
