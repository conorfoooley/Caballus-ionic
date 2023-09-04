import { IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, transformObjectIdList, ObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';

export class IdListDto {
    @IsArray()
    @IsNotEmpty()
    @IsObjectId({ each: true })
    @Transform(({value}) => transformObjectIdList(value))
    @ApiProperty()
    public ids: ObjectId[];
}
