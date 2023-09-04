import { IsInstance, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { HorseProfileDto } from './horse-profile.dto';
import { HorseGaitsDto } from './horse-gaits.dto';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo/src';

export class HorseDto extends HorseGaitsDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public _id: ObjectId;

    @ValidateNested()
    @Type(() => HorseProfileDto)
    @IsInstance(HorseProfileDto)
    @ApiProperty()
    public profile: HorseProfileDto;
}
