import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo/src';
import { IsOptional } from 'class-validator';

export class PinGalleryImageDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public horseId: ObjectId;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public mediaToPin: ObjectId;

    @IsOptional()
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public pinnedMediaToReplace: ObjectId;
}
