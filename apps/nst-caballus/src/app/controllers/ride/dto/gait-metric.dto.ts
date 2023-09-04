import { IsIn, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gait } from '@caballus/api-common';
import { Transform } from 'class-transformer';

export class GaitMetricDto {
    @IsString()
    @IsIn(Gait.members)
    @ApiProperty()
    public gait: Gait;

    @IsNumber()
    @Transform(({value}) => parseFloat(value))
    @ApiProperty()
    public metric: number;
}
