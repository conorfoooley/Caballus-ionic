import { TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular';
import { Camera } from '@capacitor/camera';
import {
    CapacitorPluginService,
    CapacitorPluginServiceShim,
    ERR_NOT_AUTHORIZED,
    ERR_NO_LOCATION_PERMISSION,
    DEFAULT_IMAGE_OPTIONS
} from './capacitor-plugin.service';
import { of, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

const MockCapacitorPluginServiceShim = {
    networkStatus: jest.fn(),
    addWatcher: jest.fn(),
    removeWatcher: jest.fn(),
    getPhoto: jest.fn(),
    checkPermissions: jest.fn()
};

const MockPlatform = {
    platforms: jest.fn()
}

describe('CapacitorPluginService', () => {
    let capacitorPluginService: CapacitorPluginService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: Platform, useValue: MockPlatform },
                { provide: CapacitorPluginServiceShim, useValue: MockCapacitorPluginServiceShim }
            ]
        });
        capacitorPluginService = TestBed.inject(CapacitorPluginService);
        jest.resetAllMocks();

        // "Official" workaround for issues with "matchMedia" object support in unit
        // tests
        //
        // https://stackoverflow.com/a/53449595
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(), // Deprecated
                removeListener: jest.fn(), // Deprecated
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }))
        });
    });

    it('should create', () => {
        expect(capacitorPluginService).toBeTruthy();
    });

    it('should report the connection status', done => {
        MockCapacitorPluginServiceShim.networkStatus.mockReturnValueOnce(of({ connected: true }));
        capacitorPluginService.networkStatus().pipe(take(1)).subscribe(status => {
            expect(typeof status.connected).not.toBe('undefined');
            done();
        });
    });

    it('should create a location watcher', done => {
        MockPlatform.platforms.mockReturnValue(['ios', 'hybrid']);
        MockCapacitorPluginServiceShim.addWatcher.mockResolvedValueOnce('0');
        let _startWatchingResult$: ReplaySubject<void> = capacitorPluginService['_startWatchingResult$'];
        let _watcherId: string = capacitorPluginService['_watcherId'];
        expect(_startWatchingResult$).toBeNull();
        expect(_watcherId).toBeNull();
        capacitorPluginService.startWatchingLocation().pipe(take(1)).subscribe(() => {
            _startWatchingResult$ = capacitorPluginService['_startWatchingResult$'];
            _watcherId = capacitorPluginService['_watcherId'];
            expect(_startWatchingResult$).toBeTruthy();
            expect(_watcherId).toBe('0');
            done();
        });
        _startWatchingResult$ = capacitorPluginService['_startWatchingResult$'];
        _startWatchingResult$.next();
    });

    it('should remove a location watcher', done => {
        MockPlatform.platforms.mockReturnValue(['ios', 'hybrid']);
        MockCapacitorPluginServiceShim.removeWatcher.mockResolvedValue(undefined);
        capacitorPluginService['_watcherId'] = '0';
        capacitorPluginService.stopWatchingLocation().pipe(take(1)).subscribe(() => {
            const _watcherId = capacitorPluginService['_watcherId'];
            expect(_watcherId).toBeNull();
            done();
        });
    });

    it('should throw a specific error if location permissions aren\'t granted', done => {
        MockPlatform.platforms.mockReturnValue(['ios', 'hybrid']);
        MockCapacitorPluginServiceShim.addWatcher.mockResolvedValueOnce('0');
        MockCapacitorPluginServiceShim.removeWatcher.mockResolvedValueOnce(undefined);
        let _startWatchingResult$: ReplaySubject<void> = capacitorPluginService['_startWatchingResult$'];
        let _watcherId: string = capacitorPluginService['_watcherId'];
        expect(_startWatchingResult$).toBeNull();
        expect(_watcherId).toBeNull();
        capacitorPluginService.startWatchingLocation().pipe(take(1)).subscribe(() =>
            () => {

            },
            err => {
                expect(err).toBe(ERR_NO_LOCATION_PERMISSION);
                done();
            }
        );
        _startWatchingResult$ = capacitorPluginService['_startWatchingResult$'];
        _startWatchingResult$.error(ERR_NOT_AUTHORIZED);
    });

    it('should use capacitor getPhoto', done => {
        MockCapacitorPluginServiceShim.getPhoto.mockResolvedValueOnce(1 as any);
        capacitorPluginService.getPhoto(DEFAULT_IMAGE_OPTIONS).pipe(take(1)).subscribe(res => {
            expect(MockCapacitorPluginServiceShim.getPhoto).toHaveBeenCalledWith(DEFAULT_IMAGE_OPTIONS);
            expect(res).toBe(1);
            done();
        });
    });

    it('should use capacitor checkPermissions', done => {
        MockCapacitorPluginServiceShim.checkPermissions.mockResolvedValueOnce(1 as any);
        capacitorPluginService.checkPermissions().pipe(take(1)).subscribe(res => {
            expect(MockCapacitorPluginServiceShim.checkPermissions).toHaveBeenCalled();
            expect(res).toBe(1);
            done();
        });
    });
});
