import { IsEmail, IsInstance, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceInfoDto } from './user/dto/device-info.dto';

export class LoginDto {
    @IsEmail()
    @Transform(({value}) => value.toLowerCase())
    @ApiProperty()
    public email: string;

    @IsString()
    @ApiProperty()
    public password: string;

    @ValidateNested()
    @Type(() => DeviceInfoDto)
    @IsInstance(DeviceInfoDto)
    @ApiProperty()
    public deviceInfo: DeviceInfoDto;
}
