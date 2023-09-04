import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import {
    HorseDalModule,
    RideDalModule,
    FriendDalModule,
    NotificationDalModule,
    UserDalModule,
    UserHorseRelationshipDalModule,
    MediaDalModule
} from '@nst-caballus/dal';

@Module({
    controllers: [RideController],
    imports: [
        RideDalModule,
        HorseDalModule,
        FriendDalModule,
        NotificationDalModule,
        UserDalModule,
        UserHorseRelationshipDalModule,
        MediaDalModule
    ]
})
export class RideModule {}
