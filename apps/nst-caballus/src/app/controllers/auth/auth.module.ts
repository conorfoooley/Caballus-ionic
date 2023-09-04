import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthDalModule, UserDalModule } from '@nst-caballus/dal';
import { UserLogDalModule } from '../../dal/user-log-dal/user-log-dal.module';

@Module({
    controllers: [AuthController],
    imports: [AuthDalModule, UserLogDalModule, UserDalModule]
})
export class AuthModule {}
