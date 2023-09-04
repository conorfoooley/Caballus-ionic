import { TestBed, async, flush, flushMicrotasks, fakeAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule, NavController } from '@ionic/angular';
import { StorageService } from '@ion-caballus/core/services';
import { Store } from '@ngxs/store';
import { Platform } from '@ionic/angular';
import { User } from '@caballus/ui-common';
import { AuthModule } from './auth/auth.module';
import { LoginComponent } from './auth/pages/login/login.component'
import { MapMyRideModule } from './tabs/map-my-ride/map-my-ride.module';
import { MapMyRideComponent } from './tabs/map-my-ride/pages/map-my-ride/map-my-ride.component';
import { ToastService } from '@rfx/ngx-toast';
import { of, Observable } from 'rxjs';

const MockStorageService = {
    getUser: jest.fn(),
    getAuthToken: jest.fn(),
    getRefreshToken: jest.fn()
};

class MockStore {
    public dispatch(actionOrActions: any): Observable<any> {
        return of(undefined);
    }
}

class MockPlatform {
    public ready(): Promise<string> {
        return Promise.resolve('');
    }
}

class MockNavController {
    public setTopOutlet(): void {

    }
    public consumeTransition(): object {
        return {};
    }
}

class MockToastService {

}

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AppComponent],
            imports: [
                RouterTestingModule,
                AuthModule,
                MapMyRideModule,
                RouterTestingModule.withRoutes([
                    {
                        path: 'auth/login',
                        component: LoginComponent
                    },
                    {
                        path: 'tabs/map-my-ride',
                        component: MapMyRideComponent
                    }
                ]),
                BrowserAnimationsModule,
                IonicModule
            ],
            providers: [
                { provide: Platform, useClass: MockPlatform },
                { provide: Store, useClass: MockStore },
                { provide: StorageService, useValue: MockStorageService },
                { provide: NavController, useClass: MockNavController },
                { provide: ToastService, useClass: MockToastService }
            ]
        }).compileComponents();
    }));

    it('should create the app', () => {
        MockStorageService.getUser.mockReturnValue(Promise.resolve(null));
        MockStorageService.getAuthToken.mockReturnValue(Promise.resolve(null));
        MockStorageService.getRefreshToken.mockReturnValue(Promise.resolve(null));
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });

    it(`should have as title 'Caballus'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual('Caballus');
    });

    it('should route to login when no session or deeplink provided', fakeAsync((): void => {
        MockStorageService.getUser.mockReturnValueOnce(Promise.resolve(null));
        MockStorageService.getAuthToken.mockReturnValueOnce(Promise.resolve(null));
        MockStorageService.getRefreshToken.mockReturnValueOnce(Promise.resolve(null));
        const router = TestBed.inject(Router);
        const mockNavigateByUrl = jest.spyOn(router, 'navigateByUrl');
        const fixture = TestBed.createComponent(AppComponent);
        flush();
        expect(mockNavigateByUrl).toHaveBeenCalledWith('/auth/login');
    }));

    /*
        TODO: (Someday?) figure out how to get this test to run without
        using setTimeout(), flush() implementation similar to /auth/login
        test above would not recognize navigateByUrl as ever having been called
    */
    it('should route to map my ride when there is a session but no deeplink', done => {
        MockStorageService.getUser.mockReturnValueOnce(Promise.resolve(new User()));
        MockStorageService.getAuthToken.mockReturnValueOnce(Promise.resolve('FAKE_TOKEN'));
        MockStorageService.getRefreshToken.mockReturnValueOnce(Promise.resolve('FAKE_TOKEN'));
        const router = TestBed.inject(Router);
        const mockNavigateByUrl = jest.spyOn(router, 'navigateByUrl');
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        setTimeout(() => {
            try {
                expect(mockNavigateByUrl).toHaveBeenCalledWith('/tabs/map-my-ride');
                done();
            } catch (e) {
                done(e);
            }
        }, 1000);
    });
});
