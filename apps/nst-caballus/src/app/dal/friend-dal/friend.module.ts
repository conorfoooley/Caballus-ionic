import { Module } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { FriendService } from './friend.service';
import { UserRepository } from './user.repository';
import { NotificationRepository } from './notification.repository';
import { MailerModule } from '@rfx/nst-mailer';
import { MediaDalModule } from '../media-dal/media-dal.module';

@Module({
    imports: [MailerModule, MediaDalModule],
    providers: [
        FriendService,
        FriendRepository,
        UserRepository,
        NotificationRepository
    ],
    exports: [FriendService]
})
export class FriendDalModule {}
