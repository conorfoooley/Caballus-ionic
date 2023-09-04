import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';

export class FriendCreateDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public addedUserId: ObjectId;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public addingUserId: ObjectId;
}
