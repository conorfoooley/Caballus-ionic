import { IsString, IsOptional, Length, IsUppercase } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { State } from '@caballus/api-common';

export class AddressDto {
    @IsString()
    @ApiProperty()
    public line1: string;

    @IsString()
    @ApiProperty()
    @IsOptional()
    public line2: string;

    @IsString()
    @ApiProperty()
    public city: string;

    @IsString()
    // tslint:disable-next-line: no-magic-numbers
    @Length(2, 2)
    @ApiProperty()
    @IsUppercase()
    public state: State;

    @IsString()
    @ApiProperty()
    public postalCode: string;
}
