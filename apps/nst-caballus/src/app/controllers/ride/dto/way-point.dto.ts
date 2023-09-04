import { IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class WayPointDto {
    @Transform(({ value }) => new Date(value))
    @IsDate()
    @ApiProperty()
    public timestamp: Date;

    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    @ApiProperty()
    public longitude: number;

    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    @ApiProperty()
    public latitude: number;

    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    @ApiProperty()
    public altitude: number;
}
