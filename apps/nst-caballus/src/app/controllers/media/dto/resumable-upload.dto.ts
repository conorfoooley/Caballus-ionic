import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResumableUploadDto {
    @IsNumber()
    @ApiProperty()
    public contentLength: number;
}
