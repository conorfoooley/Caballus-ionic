import { ValidateNested, IsInstance, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserGridFilters } from '@caballus/api-common';
import { StringFilterDto } from '@rfx/nst-common';

export class UserFiltersDto {
    @ValidateNested()
    @IsOptional()
    @Type(() => StringFilterDto)
    @IsInstance(StringFilterDto)
    @ApiProperty()
    public searchTerm: StringFilterDto;

    public toUserGridFilters(): UserGridFilters {
        return new UserGridFilters(this);
    }
}
