import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveUserSubscriptionDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public subscriptionId: string;

    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public userId: ObjectId;
}
