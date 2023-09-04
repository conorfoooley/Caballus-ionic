import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import {
    InvitationDalModule,
    HorseDalModule
} from '@nst-caballus/dal';

@Module({
    controllers: [InvitationController],
    imports: [
        HorseDalModule,
        InvitationDalModule,
    ]
})
export class InvitationModule {}
