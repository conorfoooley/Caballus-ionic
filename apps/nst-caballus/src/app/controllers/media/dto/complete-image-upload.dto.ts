import { Transform } from 'class-transformer';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo/src';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteImageUploadDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public mediaId: ObjectId;
}
