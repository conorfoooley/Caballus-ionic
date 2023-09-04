import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { AuthDalModule } from '../../../dal/auth-dal/auth-dal.module';
import { FriendService } from '../../../dal/friend-dal/friend.service';
import { FriendDalModule } from '../../../dal/friend-dal/friend.module';
import { FriendRepository } from '../../../dal/friend-dal/friend.repository';

@Module({
    controllers: [FriendController],
    imports: [AuthDalModule, FriendDalModule]
})
export class FriendModule {}
