import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Put,
    Query,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { HorseService, MediaService } from '@nst-caballus/dal';
import { LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HorsePermission, Media, UploadedFileObject, User } from '@caballus/api-common';
import { IdDto } from '@rfx/nst-db/mongo';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PinGalleryImageDto } from './dto/pin-gallery-image.dto';
import { GalleryListDto } from './dto/gallery-list.dto';
import { UploadGalleryMediaDto } from './dto/upload-gallery-media.dto';
import { DeleteGalleryMediaDto } from './dto/delete-gallery-media.dto';
import { RemovePinGalleryImageDto } from './dto/reomve-pin-gallery-image.dto';
import { IdListDto } from '../id-list.dto';

@ApiBearerAuth()
@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
    constructor(
        private readonly _mediaService: MediaService,
        private readonly _horseService: HorseService
    ) {}

    @Get('/pinned')
    @ApiOperation({ summary: 'Get Pinned Gallery Images' })
    @Secured(WildCardPermission)
    public async getPinnedImagesForHorse(
        @Query() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<Media[]> {
        return this._mediaService.getPinnedMediaByHorseId(idDto.id);
    }

    @Put('/pin')
    @ApiOperation({ summary: 'Pin a Gallery Image to the Profile' })
    @Secured(WildCardPermission)
    public async pinGalleryImage(
        @Body() dto: PinGalleryImageDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [dto.horseId],
            HorsePermission.HorseEdit
        );
        return this._mediaService.pinGalleryImage(
            dto.horseId,
            dto.mediaToPin,
            dto.pinnedMediaToReplace
        );
    }

    @Put('/pinned/remove')
    @ApiOperation({ summary: 'Remove Pin from Gallery Image' })
    @Secured(WildCardPermission)
    public async removePin(
        @Body() dto: RemovePinGalleryImageDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [dto.horseId],
            HorsePermission.HorseEdit
        );
        return this._mediaService.removePin(dto.horseId, dto.mediaToUnpinId);
    }

    @Post('')
    @ApiOperation({ summary: 'Post Media to Gallery' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'image' }, { name: 'video' }]))
    public async uploadGalleryMedia(
        @Body() idDto: IdDto,
        @Body() dto: UploadGalleryMediaDto,
        @UploadedFiles() files: UploadedFileObject,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [idDto.id],
            HorsePermission.HorseEdit
        );

        const image = !!files && !!files['image'] ? files['image'][0] : null;
        const video = !!files && !!files['video'] ? files['video'][0] : null;
        user = new User(user); // Kinda weird but not really any better way to handle this
        return this._mediaService.uploadGalleryMedia(idDto.id, dto, image, video, user);
    }

    @Post('/list')
    @ApiOperation({ summary: 'Get All Gallery Images for Horses' })
    @Secured(WildCardPermission)
    public async getHorseGallery(
        @Body() idsDto: IdListDto,
        @Body() dto: GalleryListDto,
        @LoggedInUser() user: User
    ): Promise<Media[]> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            idsDto.ids,
            HorsePermission.HorseView
        );
        return this._mediaService.getHorseGallery(
            idsDto.ids,
            dto.mediaType,
            dto.sortOption,
            dto.galleryCategory
        );
    }

    @Delete('')
    @ApiOperation({ summary: 'Remove gallery media' })
    @Secured(WildCardPermission)
    public async removeHorseGalleryMedia(
        @Body() dto: DeleteGalleryMediaDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        await this._horseService.checkUserHasHorsePermission(
            user._id,
            [dto.horseId],
            HorsePermission.HorseEdit
        );
        return this._mediaService.deleteMedia(dto.mediaId);
    }
}
