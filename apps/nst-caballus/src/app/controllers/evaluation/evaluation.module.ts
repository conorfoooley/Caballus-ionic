import { Module } from '@nestjs/common';
import { HorseEvaluationController } from './evaluation.controller';
import { HorseDalModule, HorseEvaluationDalModule } from '@nst-caballus/dal';

@Module({
    controllers: [HorseEvaluationController],
    imports: [HorseEvaluationDalModule, HorseDalModule]
})
export class HorseEvaluationModule {}
