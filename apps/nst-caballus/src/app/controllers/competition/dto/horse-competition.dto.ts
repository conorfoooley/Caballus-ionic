import { IsString, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ObjectId } from '@rfx/njs-db/mongo';
import { IsObjectId, transformObjectId } from '@rfx/nst-db/mongo';

export class HorseCompetitionDto {

    @IsOptional()
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public _id?: ObjectId;

    @ApiProperty()
    @IsString()
    public name: string;

    @ApiProperty()
    @IsDate()
    @Transform(({value}) => new Date(value))
    public date: Date;

    @ApiProperty()
    @IsString()
    public location: string;

    @ApiProperty()
    @IsString()
    public results: string;


    @ApiProperty()
    @IsString()
    public notes: string;
}
