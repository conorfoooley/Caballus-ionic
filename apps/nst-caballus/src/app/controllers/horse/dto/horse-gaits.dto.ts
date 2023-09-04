import { IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GaitNumbers, transformGaitsKilometersPerHour } from '@caballus/api-common';

export class HorseGaitsDto {
    @IsObject()
    @Transform(({value}) => transformGaitsKilometersPerHour(value))
    @ApiProperty()
    public gaitsKilometersPerHour: GaitNumbers;
}
