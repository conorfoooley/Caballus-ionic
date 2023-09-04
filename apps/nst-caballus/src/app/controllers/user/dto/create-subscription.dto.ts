import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { Transform } from 'class-transformer';

export class CreateSubscriptionDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public paymentMethod: string;

    @IsOptional()
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public payingForUserId: ObjectId;

    @IsOptional()
    @IsString()
    @ApiProperty()
    public couponCode: string;
}
