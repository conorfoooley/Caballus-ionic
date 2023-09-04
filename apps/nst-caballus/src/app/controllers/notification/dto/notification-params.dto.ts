import { NotificationGridParams } from '@caballus/api-common';
import { ApiProperty } from '@nestjs/swagger';
import { GridParamsDto } from '@rfx/nst-common';
import { Type } from 'class-transformer';
import { IsInstance, IsOptional, ValidateNested } from 'class-validator';
import { NotificationFiltersDto } from './notification-filters.dto';

export class NotificationParamsDto extends GridParamsDto {
    @ValidateNested()
    @IsOptional()
    @Type(() => NotificationFiltersDto)
    @IsInstance(NotificationFiltersDto)
    @ApiProperty()
    public filters: NotificationFiltersDto;

    public toNotificationGridParams(): NotificationGridParams {
        return new NotificationGridParams(this, this.filters);
    }
}
