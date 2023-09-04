import { UploadedFileObject, Media, User, ResumableMediaUpload } from '@caballus/api-common';
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IdDto } from '@rfx/nst-db/mongo';
import {
  Secured,
  WildCardPermission,
  LoggedInUser,
} from '@rfx/nst-permissions';
import { MediaService } from '../../dal/media-dal/media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { ResumableUploadDto } from './dto/resumable-upload.dto';
import { CompleteImageUploadDto } from './dto/complete-image-upload.dto';
import { CompleteResumableUploadDto } from './dto/complete-resumable-upload.dto';
import { RefreshUploadLinksDto } from './dto/refresh-upload-links.dto';

@ApiBearerAuth()
@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly _mediaService: MediaService) {}

  @Post('create-media')
  @ApiOperation({ summary: 'Create base media document' })
  @Secured(WildCardPermission)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  public async createMedia(
    @Body() idDto: IdDto,
    @Body() dto: CreateMediaDto,
    @UploadedFile() thumbnail: UploadedFileObject,
    @LoggedInUser() user: User
  ): Promise<Media> {
    return this._mediaService.createMediaV2(
      idDto.id,
      dto.filePath,
      dto.collectionName,
      dto.mediaSubjectId,
      dto.mediaType,
      thumbnail,
      new User(user).toIdentity()
    );
  }

  @Post('initiate-resumable-upload')
  @ApiOperation({ summary: 'It initiates the resumable upload on the JWPlayer server' })
  @Secured(WildCardPermission)
  public async initiateResumableUpload(
    @Body() dto: ResumableUploadDto,
  ): Promise<ResumableMediaUpload> {
    return this._mediaService.initiateResumableUpload(dto.contentLength);
  }

  @Post('complete-resumable-upload')
  @ApiOperation({ summary: 'It complete the resumable upload on the JWPlayer server' })
  @Secured(WildCardPermission)
  public async completeResumableUpload(
    @Body() dto: CompleteResumableUploadDto,
  ): Promise<void> {
    return this._mediaService.completeResumableUpload(
      dto.uploadId,
      dto.uploadToken,
      dto.id,
      dto.jwPlayerId
    );
  }

  @Post('refresh-upload-links')
  @ApiOperation({ summary: 'It refresh the JWPlayer resumable upload links' })
  @Secured(WildCardPermission)
  public async refreshUploadLinks(
    @Body() dto: RefreshUploadLinksDto,
  ): Promise<Array<string>> {
    return this._mediaService.refreshUploadLinks(
        dto.uploadId,
        dto.uploadToken,
        dto.contentLength
    );
  }

  @Post('complete-image-upload')
  @ApiOperation({ summary: 'Completes the Image upload process!' })
  @Secured(WildCardPermission)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  public async completeImageUpload(
    @Body() dto: CompleteImageUploadDto,
    @UploadedFile() image: UploadedFileObject,
  ): Promise<void> {
    return this._mediaService.completeImageUpload(
      dto.mediaId,
      image
    );
  }

  @Post("get-media-by-id")
  @ApiOperation({ summary: "It returns media by id" })
  @Secured(WildCardPermission)
  public async getMediaById(
    @Body() dto: IdDto
  ): Promise<Media> {
    return this._mediaService.getMediaById(dto.id);
  }
}
