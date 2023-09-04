import { NotificationGridFilters } from '@caballus/api-common';
import { ApiProperty } from '@nestjs/swagger';
import { DateRangeFilterDto } from '@rfx/nst-common';
import { Type } from 'class-transformer';
import { IsInstance, IsOptional, ValidateNested } from 'class-validator';

export class NotificationFiltersDto {
    @ValidateNested()
    @IsOptional()
    @Type(() => DateRangeFilterDto)
    @IsInstance(DateRangeFilterDto)
    @ApiProperty()
    public createdDate: DateRangeFilterDto;

    public toNotificationGridFilters(): NotificationGridFilters {
        return new NotificationGridFilters(this);
    }
}
