import { IdDto } from '@rfx/nst-db/mongo/src';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RefreshUploadLinksDto extends IdDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public uploadId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    public uploadToken: string;

    @IsNumber()
    @ApiProperty()
    public contentLength: number;
}
