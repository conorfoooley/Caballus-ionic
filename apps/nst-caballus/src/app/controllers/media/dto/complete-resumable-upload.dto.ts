import { IdDto } from '@rfx/nst-db/mongo/src';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteResumableUploadDto extends IdDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public uploadId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public uploadToken: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public jwPlayerId: string;
}
