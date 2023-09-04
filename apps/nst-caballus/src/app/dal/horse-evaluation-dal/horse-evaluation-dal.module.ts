import { Module } from '@nestjs/common';
import { HorseEvaluationService } from './horse-evaluation.service';
import { HorseEvaluationRepository } from './horse-evaluation.repository';
import { HorseDalModule } from '../horse-dal/horse-dal.module';
import { HorseRepository } from './horse.repository';
import { HorseEvaluationMatrixRepository } from './horse-evaluation-matrix.repository';
import { UserRepository } from './user.repository';
import { MediaDalModule } from '../media-dal/media-dal.module';

@Module({
    imports: [MediaDalModule, HorseDalModule],
    providers: [
        HorseEvaluationRepository,
        HorseEvaluationMatrixRepository,
        HorseRepository,
        UserRepository,
        HorseEvaluationService
    ],
    exports: [HorseEvaluationService]
})
export class HorseEvaluationDalModule { }
