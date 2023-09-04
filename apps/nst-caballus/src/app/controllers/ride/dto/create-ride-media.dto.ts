import { IsIn, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { IsObjectId, ObjectId, transformObjectId } from "@rfx/nst-db/mongo/src";
import { ApiProperty } from "@nestjs/swagger";
import { MediaDocumentType } from "@caballus/common";

export class CreateRideMediaDto {
  @IsObjectId()
  @Transform(({ value }) => transformObjectId(value))
  @ApiProperty()
  public mediaId: ObjectId;

  @IsOptional()
  @IsString()
  @ApiProperty()
  public filePath: string;

  @IsString()
  @IsIn(MediaDocumentType.members)
  @ApiProperty()
  public mediaType: MediaDocumentType;
}
