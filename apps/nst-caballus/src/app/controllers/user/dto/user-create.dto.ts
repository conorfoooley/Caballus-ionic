import { ArrayMinSize, IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, ObjectId, transformObjectIdList } from '@rfx/nst-db/mongo';
import { Timezone } from '@caballus/api-common';
import { UserDisciplines } from '@caballus/common';

export class UserCreateDto {
    @IsEmail()
    @ApiProperty()
    public email: string;

    @IsString()
    @ApiProperty()
    public firstName: string;

    @IsString()
    @ApiProperty()
    public lastName: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    public phone: string;

    @IsString()
    @IsOptional()
    @IsIn(Timezone.members)
    @ApiProperty()
    public timezone: Timezone;

    @IsArray()
    @IsOptional()
    @ApiProperty()
    public disciplines: UserDisciplines[];

    @IsArray()
    @ArrayMinSize(1)
    @IsObjectId({ each: true })
    @Transform(({ value }) => transformObjectIdList(value))
    @ApiProperty()
    public roleIds: ObjectId[];
}
