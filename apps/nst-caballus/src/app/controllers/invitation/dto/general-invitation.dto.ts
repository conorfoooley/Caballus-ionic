import { IsEmail } from 'class-validator';
import { ObjectId, transformObjectId, IsObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GeneralInvitationDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public toUserId: ObjectId;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public horseId: ObjectId;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public toRoleId: ObjectId;
}
