import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo/src';

export class RemovePinGalleryImageDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public horseId: ObjectId;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public mediaToUnpinId: ObjectId;
}
