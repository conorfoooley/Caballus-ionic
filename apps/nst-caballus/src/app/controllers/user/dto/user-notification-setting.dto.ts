import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInstance, ValidateNested } from 'class-validator';
import { AllowNotificationSettingDto } from './allow-notification-setting.dto';
import { SendNotificationSettingDto } from './send-notification-setting.dto';

export class UserNotificationSettingDto {
    @ValidateNested()
    @Type(() => AllowNotificationSettingDto)
    @IsInstance(AllowNotificationSettingDto)
    @ApiProperty()
    public allowNotificationSetting: AllowNotificationSettingDto;

    @ValidateNested()
    @Type(() => SendNotificationSettingDto)
    @IsInstance(SendNotificationSettingDto)
    @ApiProperty()
    public sendNotificationSetting: SendNotificationSettingDto;
}
