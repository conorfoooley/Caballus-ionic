import { IsString, IsIn, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId, IsObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { HorseMatrixType } from '@caballus/api-common';

export class CreateHorseEvaluationMatrixDto {

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public horseId: ObjectId;

    @IsObjectId()
    @ApiProperty()
    @Transform(({ value }) => transformObjectId(value))
    public evaluationId: ObjectId;

    @ApiProperty()
    @IsString()
    public horseMatrixType: HorseMatrixType | string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    public horseMatrixGroupTitle: string;

    @ApiProperty()
    @IsOptional()
    @Transform(a => a ? Number(a.value) : null)
    public rating: number;

    @ApiProperty()
    @IsString()
    public notes: string;
}
