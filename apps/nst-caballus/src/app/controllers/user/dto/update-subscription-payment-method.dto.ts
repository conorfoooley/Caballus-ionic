import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSubscriptionPaymentMethodDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public customerId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public subscriptionId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public oldPaymentMethod: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public newPaymentMethod: string;
}
