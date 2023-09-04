import { ValidateNested, IsInstance, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserGridParams } from '@caballus/api-common';
import { GridParamsDto } from '@rfx/nst-common';
import { UserFiltersDto } from './user-filters.dto';

export class UserParamsDto extends GridParamsDto {
    @ValidateNested()
    @IsOptional()
    @Type(() => UserFiltersDto)
    @IsInstance(UserFiltersDto)
    @ApiProperty()
    public filters: UserFiltersDto;

    public toUserGridParams(): UserGridParams {
        return new UserGridParams(this, this.filters);
    }
}
