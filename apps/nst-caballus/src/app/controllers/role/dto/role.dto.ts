import { IsString, IsArray, IsIn, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Permission, RoleSettings } from '@caballus/api-common';
import { ObjectId, IsObjectId } from '@rfx/nst-db/mongo';
import { RoleSettingsDto } from './role-settings-dto';

export class RoleDto {
    @IsString()
    @ApiProperty()
    public name: string;

    @IsArray()
    @IsIn(Permission.members, { each: true })
    @ApiProperty()
    public permissions: Permission[];

    @IsDefined()
    @ValidateNested()
    @Type(() => RoleSettingsDto)
    @ApiProperty()
    public settings: RoleSettings;

}
