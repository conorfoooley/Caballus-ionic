import { IsArray, IsDate, IsInstance, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ObjectId } from '@rfx/njs-db/mongo';
import { IsObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { GaitMetricDto } from './gait-metric.dto';

export class RideGaitMetricsDto {
    @Transform(({ value }) => transformObjectId(value))
    @IsObjectId()
    @ApiProperty()
    public horseId: ObjectId;

    @IsArray()
    @ValidateNested()
    @Type(() => GaitMetricDto)
    @ApiProperty()
    public metrics: GaitMetricDto[];
}
