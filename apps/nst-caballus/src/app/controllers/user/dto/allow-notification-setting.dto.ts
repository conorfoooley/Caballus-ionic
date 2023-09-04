import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AllowNotificationSettingDto {
    @ApiProperty()
    @IsBoolean()
    public onNewDataAddedOnHorse: boolean;

    @ApiProperty()
    @IsBoolean()
    public onFriendHasNewActivity: boolean;

    @ApiProperty()
    @IsBoolean()
    public onHorseFollowNewActivity: boolean;

}
