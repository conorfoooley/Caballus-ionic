import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsObjectId, ObjectId, transformObjectId } from "@rfx/nst-db/mongo";

export class GetRideMediaByIdDto {
  @IsObjectId()
  @Transform(({ value }) => transformObjectId(value))
  @ApiProperty()
  public rideId: ObjectId;

  @IsObjectId()
  @Transform(({ value }) => transformObjectId(value))
  @ApiProperty()
  public mediaId: ObjectId;
}
