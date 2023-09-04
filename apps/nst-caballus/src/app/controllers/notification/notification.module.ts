import { Module } from '@nestjs/common';
import { NotificationDalModule } from '@nst-caballus/dal';
import { NotificationController } from './notification.controller';

@Module({
    controllers: [NotificationController],
    imports: [NotificationDalModule]
})
export class NotificationModule {}
