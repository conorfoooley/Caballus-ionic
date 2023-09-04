import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ForgotDto {
    @IsEmail()
    @Transform(({value}) => value.toLowerCase())
    @ApiProperty()
    public email: string;
}
