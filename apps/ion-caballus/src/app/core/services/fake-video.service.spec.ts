import { FakeVideoService } from "./fake-video.service";
import { TestBed, fakeAsync } from '@angular/core/testing';

describe('FakeVideoService', () => {
    let service: FakeVideoService;

    beforeEach(fakeAsync(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FakeVideoService);
    }));

    it('should return placeholder video', async () => {
        window.fetch = jest.fn().mockResolvedValue(undefined);
        await service.getVideo();

        expect(window.fetch).toHaveBeenCalledWith('/assets/images/placeholder-video.mp4');
    });
});
