import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { HorseDalModule, MediaDalModule } from '@nst-caballus/dal';

@Module({
    controllers: [GalleryController],
    imports: [MediaDalModule, HorseDalModule]
})
export class GalleryModule {}
