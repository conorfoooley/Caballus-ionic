import { Module } from '@nestjs/common';
import { HorseCompetitionService } from './horse-competition.service';
import { HorseCompetitionRepository } from './horse-competition.repository';
import { HorseDalModule } from '../horse-dal/horse-dal.module';
import { HorseRepository } from './horse.repository';
import { UserRepository } from './user.repository';
import { MediaDalModule } from '../media-dal/media-dal.module';

@Module({
    imports: [MediaDalModule, HorseDalModule],
    providers: [
        HorseCompetitionRepository,
        HorseRepository,
        UserRepository,
        HorseCompetitionService
    ],
    exports: [HorseCompetitionService]
})
export class HorseCompetitionDalModule { }
