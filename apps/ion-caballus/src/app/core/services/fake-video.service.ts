import { Injectable } from '@angular/core';
import { GetVideo } from '../interfaces/get-video';
import { Video } from '@caballus/ui-common';

/**
 * Video service that always returns the same sample video just to get
 * development going until we can figure out a more correct implementation for
 * how to get videos from the device.
 *
 * NOTE: This class should not be injected directly and instead should be
 * injected through the `GetVideo` interface.
 */
@Injectable({ providedIn: 'root' })
export class FakeVideoService implements GetVideo {
    public getVideo(_options?: unknown): Promise<Video> {
        return fetch('/assets/images/placeholder-video.mp4');
    }
}
