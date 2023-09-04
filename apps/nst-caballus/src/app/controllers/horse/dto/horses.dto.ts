import { ValidateNested, IsInstance, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { HorseDto } from './horse.dto';

export class HorsesDto {

    @ValidateNested()
    @IsArray()
    @ArrayMinSize(1)
    @Type(() => HorseDto)
    @IsInstance(HorseDto, { each: true })
    @ApiProperty()
    public horses: HorseDto[];
}
