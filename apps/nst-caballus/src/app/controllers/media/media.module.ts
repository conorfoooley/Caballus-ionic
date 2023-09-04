import { Module } from "@nestjs/common";
import { MediaController } from "./media.controller";
import { MediaDalModule } from "../../dal/media-dal/media-dal.module";

@Module({
    imports: [
        MediaDalModule
    ],
    controllers: [
        MediaController
    ],
})
export class MediaModule { }