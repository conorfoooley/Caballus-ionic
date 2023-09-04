import { IsString } from "class-validator";
import { Transform } from "class-transformer";
import { IsObjectId, ObjectId, transformObjectId } from "@rfx/nst-db/mongo/src";
import { ApiProperty } from "@nestjs/swagger";

export class UploadRideVideoDto {
    @IsObjectId()
    @Transform(({ value }) => transformObjectId(value))
    @ApiProperty()
    public videoId: ObjectId;

    @IsString()
    @ApiProperty()
    public filePath: string;
}
