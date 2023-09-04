import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetInvitationsbyHorseDto {
    @IsOptional()
    @Transform(({value}) => (typeof value === 'string' && value.toLowerCase() === 'true'))
    @IsBoolean()
    @ApiProperty()
    public includeOwner: boolean;

    @IsOptional()
    @Transform(({value}) => (typeof value === 'string' && value.toLowerCase() === 'true'))
    @IsBoolean()
    @ApiProperty()
    public onlySent: boolean;
}
