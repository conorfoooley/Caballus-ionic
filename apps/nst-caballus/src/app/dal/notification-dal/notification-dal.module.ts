import { Module } from '@nestjs/common';
import { UserDalModule } from '../user-dal/user-dal.module';
// import { InactiveUserNotificationService } from './inactive-user-notification.service.aa';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { ConnectionRepository } from './connection.repository';
import { RoomRepository, Room, MessageRepository, Message, MessageReadStat } from '@rfx/nst-chat';

@Module({
    imports: [UserDalModule],
    providers: [NotificationService, /* InactiveUserNotificationService, */ NotificationRepository,
     ConnectionRepository,RoomRepository,MessageRepository],
    exports: [NotificationService, /* InactiveUserNotificationService */]
})
export class NotificationDalModule {}
