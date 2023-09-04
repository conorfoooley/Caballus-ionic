import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HorseBreed } from '@caballus/api-common';

export class HorseBioDto {
    @IsString()
    @ApiProperty()
    public commonName: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public breedOther: string;

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
