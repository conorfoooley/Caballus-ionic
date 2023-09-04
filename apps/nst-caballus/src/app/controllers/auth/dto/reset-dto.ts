import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetDto {
    @IsString()
    @ApiProperty()
    public password: string;
}
