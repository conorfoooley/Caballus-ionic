import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthDalModule, UserDalModule } from '@nst-caballus/dal';
import { UserHorseRelationshipDalModule } from '../../dal/user-horse-relationship-dal/user-horse-relationship-dal.module';
import { ServicesModule } from '../../library/services/services.module';

@Module({
    controllers: [UserController],
    imports: [UserDalModule, AuthDalModule, UserHorseRelationshipDalModule]
})
export class UserModule {}
