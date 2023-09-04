import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo/src';

export class TransferHorseDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public userId: ObjectId;
}
