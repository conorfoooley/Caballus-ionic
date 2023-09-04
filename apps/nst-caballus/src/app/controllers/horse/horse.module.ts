import { Module } from '@nestjs/common';
import { HorseController } from './horse.controller';
import { HorseDalModule, InvitationDalModule } from '@nst-caballus/dal';

@Module({
    controllers: [HorseController],
    imports: [HorseDalModule, InvitationDalModule]
})
export class HorseModule {}
