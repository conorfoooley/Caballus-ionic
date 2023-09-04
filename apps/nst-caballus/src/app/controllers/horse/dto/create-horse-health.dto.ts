import { IsString, IsIn, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId, IsObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { HorseHealthType } from '@caballus/api-common';

export class CreateHorseHealthDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public _id: ObjectId;

    @IsObjectId()
    @ApiProperty()
    @Transform(({ value }) => transformObjectId(value))
    public horseId: ObjectId;

    @ApiProperty()
    @IsString()
    @IsIn(HorseHealthType.members)
    public horseHealthType: HorseHealthType;

    @ApiProperty()
    @IsString()
    public notes: string;

    @ApiProperty()
    @IsDate()
    @Transform(({value}) => new Date(value))
    public date: Date;
}
