import { IsString, IsEmail, IsAlphanumeric, IsLowercase, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserRegistrationDto {
    @IsString()
    @ApiProperty()
    public firstName: string;

    @IsString()
    @ApiProperty()
    public lastName: string;

    @IsEmail()
    @Transform(({value}) => value.toLowerCase())
    @ApiProperty()
    public email: string;

    @IsString()
    @ApiProperty()
    public password: string;

    @IsString()
    @Transform(({value}) => value.toLowerCase())
    @IsAlphanumeric()
    @ApiProperty()
    public url: string;

    @IsBoolean()
    @ApiProperty()
    public acceptedTerms: boolean;
}
