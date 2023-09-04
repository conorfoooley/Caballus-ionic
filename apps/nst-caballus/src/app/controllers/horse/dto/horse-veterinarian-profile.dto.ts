import { IsString, IsOptional, ValidateNested, IsInstance, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from '../../address-dto';
import { Type } from 'class-transformer';

export class HorseVeterinarianProfileDto {
    @IsString()
    @ApiProperty()
    public fullName: string;

    @IsEmail()
    @ApiProperty()
    public email: string;

    @IsString()
    @ApiProperty()
    public phone: string;

    @ValidateNested()
    @Type(() => AddressDto)
    @IsInstance(AddressDto)
    @ApiProperty()
    public address: AddressDto;

}
