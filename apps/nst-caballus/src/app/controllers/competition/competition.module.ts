import { Module } from '@nestjs/common';
import { HorseCompetitionController } from './competition.controller';
import { HorseDalModule, HorseCompetitionDalModule } from '@nst-caballus/dal';

@Module({
    controllers: [HorseCompetitionController],
    imports: [HorseCompetitionDalModule, HorseDalModule]
})
export class HorseCompetitionModule {}
