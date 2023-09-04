import { IsString, IsArray, IsNumber, IsOptional, IsIn, ValidateNested, IsInstance } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { HorseBreed } from '@caballus/api-common';
import { HorseProfilePrivacyDto } from './horse-profile-privacy.dto';
import { HorseBioDto } from './horse-bio.dto';

export class HorseProfileDto extends HorseBioDto {

    @IsString()
    @ApiProperty()
    public commonName: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public breedOther: string;


    @IsOptional()
    @ApiProperty()
    public privacy: HorseProfilePrivacyDto;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public registeredName: string;

    @IsString()
    @IsOptional()
    @IsIn(HorseBreed.members)
    @ApiProperty()
    public breed: HorseBreed;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public registrationNumber: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty()
    public heightMeters: number;

    @IsNumber()
    @IsOptional()
    @ApiProperty()
    public weightKilograms: number;

}
