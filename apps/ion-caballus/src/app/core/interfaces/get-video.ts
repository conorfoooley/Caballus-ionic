import { Video } from '@caballus/ui-common';
import { Injectable } from '@angular/core';

// This was written as an interface but ultimately kept as an abstract class so
// that it can be integrated into DI

@Injectable()
export abstract class GetVideo {
    /**
     * Retrives a video from any source and returns it.
     *
     * @param options optional arguments for the particular source of the video
     * @returns a video
     */
    public abstract getVideo(options?: unknown): Promise<Video>;
}
