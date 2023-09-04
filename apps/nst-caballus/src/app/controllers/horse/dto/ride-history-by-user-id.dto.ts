import { IsNumberString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsObjectId, ObjectId, transformObjectId } from "@rfx/nst-db/mongo/src";

export class RideHistoryByUserIdDto {
  @IsObjectId()
  @Transform(({ value }) => transformObjectId(value))
  @ApiProperty()
  public id: ObjectId;

  @IsNumberString()
  @ApiProperty()
  public skipRecord: number;
}
