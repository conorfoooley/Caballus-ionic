import { IsArray, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsObjectId, ObjectId, transformObjectId, transformObjectIdList } from '@rfx/nst-db/mongo';

export class StartRideDto {
  @Transform(({ value }) => transformObjectId(value))
  @IsObjectId()
  @ApiProperty()
  public _id: ObjectId;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @ApiProperty()
  public startDateTime: Date;

  @IsArray()
  @Transform(({ value }) => transformObjectIdList(value))
  @IsObjectId({ each: true })
  @ApiProperty()
  public horseIds: ObjectId[];
}
