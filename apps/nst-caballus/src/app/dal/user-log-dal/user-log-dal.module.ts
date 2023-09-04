import { Module } from '@nestjs/common';
import { UserLogService } from './user-log.service';
import { UserRepository } from './user.repository';

@Module({
    imports: [],
    providers: [
        UserRepository,
        UserLogService
    ],
    exports: [UserLogService]
})
export class UserLogDalModule { }
