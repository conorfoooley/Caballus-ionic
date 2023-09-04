import { UserAppInfo } from '@caballus/api-common';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class DeviceInfoDto {
    @IsString()
    @IsOptional()
    @ApiProperty()
    public deviceId: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public os: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public osVersion: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public deviceName: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public deviceModel: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty()
    public ramAvailable: number;

    @IsArray()
    @IsOptional()
    @ApiProperty()
    public appInfo: UserAppInfo[];

    @IsString()
    @IsOptional()
    @ApiProperty()
    public platform: string;
}
