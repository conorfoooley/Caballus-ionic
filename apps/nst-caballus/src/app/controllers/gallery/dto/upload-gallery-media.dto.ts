import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo/src';
import { ApiProperty } from '@nestjs/swagger';

export class UploadGalleryMediaDto {
    @IsOptional()
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public imageId: ObjectId;

    @IsOptional()
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public videoId: ObjectId;
}
