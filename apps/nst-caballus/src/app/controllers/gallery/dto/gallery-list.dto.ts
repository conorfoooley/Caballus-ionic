import { IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GalleryCategory, GallerySortByOption, MediaDocumentType } from '@caballus/api-common';

export class GalleryListDto {
    @IsOptional()
    @IsIn(MediaDocumentType.members)
    @ApiProperty()
    public mediaType: MediaDocumentType;

    @IsOptional()
    @IsIn(GallerySortByOption.members)
    @ApiProperty()
    public sortOption: GallerySortByOption;

    @IsOptional()
    @IsIn(GalleryCategory.members)
    @ApiProperty()
    public galleryCategory: GalleryCategory;

}
