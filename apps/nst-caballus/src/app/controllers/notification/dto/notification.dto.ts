import { IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsObjectId, ObjectId, transformObjectId } from '@rfx/nst-db/mongo';
import { Category } from '@caballus/common';

export class NotificationDto {
    @IsObjectId()
    @ApiProperty({ type: String })
    @Transform(({ value }) => transformObjectId(value))
    public _id: ObjectId;


    @IsString()
    @ApiProperty()
    public description: string;

    @IsString()
    @ApiProperty({ enum: Category })
    public category: Category;

    @IsBoolean()
    @ApiProperty()
    public isRead: boolean;

    @IsObjectId()
    @ApiProperty({ type: String })
    @Transform(({ value }) => transformObjectId(value))
    public rideId: ObjectId;

    @IsObjectId()
    @ApiProperty({ type: String })
    @Transform(({ value }) => transformObjectId(value))
    public horseId: ObjectId;

    // @IsArray()
    // @IsIn(Permission.members, { each: true })
    // @ApiProperty()
    // public permissions: Permission[];
}
