import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleSettingsDto {
    @IsBoolean()
    @ApiProperty()
    public canEdit: boolean;

    @IsBoolean()
    @ApiProperty()
    public canDelete: boolean;

}

