import { IsArray, IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { RideCategory } from '@caballus/api-common';
import { IsObjectId, ObjectId, transformObjectId, transformObjectIdList } from '@rfx/nst-db/mongo';

export class RideEntryDto {
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
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

    @IsOptional()
    @IsString()
    @ApiProperty()
    public name: string;

    // Dtos don't allow RideGaitMinutes to be formatted exactly like model
    public toPartialRideModel(dto: RideEntryDto): {
        distanceKilometers: number,
        category: RideCategory,
        notes: string,
        endDateTime: Date,
        startDateTime: Date,
        horseIds: ObjectId[],
        name: string
    } {

        return dto;
    }
}
