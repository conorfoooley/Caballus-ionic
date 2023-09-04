import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SendNotificationSettingDto {
    @ApiProperty()
    @IsBoolean()
    public appPushNotification: boolean;

    @ApiProperty()
    @IsBoolean()
    public emailNotification: boolean;

}
