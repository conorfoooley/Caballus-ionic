import { ArrayNotEmpty, IsArray, IsDate, IsIn, IsInstance, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { RidePathDto } from './ride-path.dto';
import { RideGaitMetricsDto } from './ride-gait-metrics.dto';
import { RideGaitMetrics, Gait, RideCategory, RidePath, GaitNumbers } from '@caballus/api-common';
import { IsObjectId, ObjectId, transformObjectId, transformObjectIdList } from '@rfx/nst-db/mongo';

export class RideDetailsDto {
    @IsNumber()
    @Transform(({value}) => parseFloat(value))
    @ApiProperty()
    public distanceKilometers: number;

    @IsString()
    @IsIn(RideCategory.members)
    @ApiProperty()
    public category: RideCategory;

    @IsOptional()
    @IsString()
    @ApiProperty()
    public notes: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => RidePathDto)
    @ApiProperty()
    public paths: RidePathDto[];

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => RideGaitMetricsDto)
    @ApiProperty()
    public calculatedGaitMinutes: RideGaitMetricsDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested()
    @Type(() => RideGaitMetricsDto)
    @ApiProperty()
    public manualGaitMinutes: RideGaitMetricsDto[];

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => RideGaitMetricsDto)
    @ApiProperty()
    public calculatedGaitKilometers: RideGaitMetricsDto[];

    @Transform(({ value }) => transformObjectId(value))
    @IsObjectId()
    @ApiProperty()
    public _id: ObjectId;

    @IsOptional()
    @Transform(({value}) => new Date(value))
    @IsDate()
    @ApiProperty()
    public endDateTime: Date;

    @IsOptional()
    @Transform(({value}) => new Date(value))
    @IsDate()
    @ApiProperty()
    public startDateTime: Date;

    @IsOptional()
    @IsArray()
    @Transform(({value}) => transformObjectIdList(value))
    @IsObjectId({ each: true })
    @ApiProperty()
    public horseIds: ObjectId[];

    // Dtos don't allow RideGaitMinutes to be formatted exactly like model
    public toPartialRideModel(dto: RideDetailsDto): {
        distanceKilometers: number,
        category: RideCategory,
        notes: string,
        paths: RidePath[],
        calculatedGaitMinutes: RideGaitMetrics[],
        manualGaitMinutes: RideGaitMetrics[],
        calculatedGaitKilometers: RideGaitMetrics[],
        endDateTime: Date,
        startDateTime: Date,
        horseIds: ObjectId[]
    } {
        const calculatedGaitMinutes = this._reformatGaitMetrics(dto.calculatedGaitMinutes);
        const manualGaitMinutes = this._reformatGaitMetrics(dto.manualGaitMinutes);
        const calculatedGaitKilometers = this._reformatGaitMetrics(dto.calculatedGaitKilometers);

        return {
            ...dto,
            paths: dto.paths as any, // Typescript cranky dto doesn't have same methods as class
            calculatedGaitMinutes,
            manualGaitMinutes,
            calculatedGaitKilometers
        };
    }

    private _reformatGaitMetrics(dtos: RideGaitMetricsDto[]): RideGaitMetrics[] {
        const rideGaitMetrics: RideGaitMetrics[] = [];
        if (!!dtos && dtos.length > 0) {
            for (const dto of dtos) {
                const gaitMetrics: GaitNumbers = Gait.gaitNumbersNulled();
                for (const m of dto.metrics) {
                    gaitMetrics[m.gait] = m.metric;
                }
                rideGaitMetrics.push(new RideGaitMetrics({
                    horseId: dto.horseId,
                    metrics: gaitMetrics
                }));
            }
        }
        return rideGaitMetrics;
    }
}
