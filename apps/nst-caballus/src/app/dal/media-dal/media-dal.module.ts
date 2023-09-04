import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
      HttpModule
    ],
    providers: [MediaService, MediaRepository],
    exports: [MediaService]
})
export class MediaDalModule {}
