import { ArrayNotEmpty, IsArray, IsDate, IsInstance, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { WayPointDto } from './way-point.dto';

export class RidePathDto {
    @Transform(({ value }) => new Date(value))
    @IsDate()
    @ApiProperty()
    public startDateTime: Date;

    @Transform(({ value }) => new Date(value))
    @IsDate()
    @ApiProperty()
    public endDateTime: Date;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => WayPointDto)
    @ApiProperty()
    public wayPoints: WayPointDto[];
}
