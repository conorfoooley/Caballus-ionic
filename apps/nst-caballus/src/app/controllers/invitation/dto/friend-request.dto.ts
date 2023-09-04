import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class FriendRequestDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public _id: ObjectId;

    @IsString()
    @ApiProperty()
    public firstName: string;

    @IsString()
    @ApiProperty()
    public lastName: string;

    @IsEmail()
    @ApiProperty()
    public email: string;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public friendRequestId: ObjectId;
}
