import { IsEmail } from 'class-validator';
import { ObjectId, transformObjectId, IsObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OwnerInvitationDto {
    @IsEmail()
    @ApiProperty()
    public recipientEmail: string;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public horseId: ObjectId;
}
