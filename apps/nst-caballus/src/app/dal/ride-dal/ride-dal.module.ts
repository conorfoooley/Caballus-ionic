import { Module } from '@nestjs/common';
import { RideService } from './ride.service';
import { RideRepository } from './ride.repository';
import { UserToHorseCacheRepository } from './user-to-horse-cache.repository';
import { MediaDalModule } from '../media-dal/media-dal.module';
import { HorseRepository } from './horse.repository';

@Module({
    imports: [MediaDalModule],
    providers: [RideService, RideRepository, UserToHorseCacheRepository, HorseRepository],
    exports: [RideService]
})
export class RideDalModule {}
