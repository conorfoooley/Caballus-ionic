import { Location } from '@angular/common';
import { Component, DebugElement } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SubMenuBarComponent } from './components/sub-menu-bar.component';
import { NavigationBarComponent } from './navigation-bar.component';

@Component({
    template: ''
})
class BlankComponent { }

describe('NavigationBarComponent', () => {
    let component: NavigationBarComponent;
    let fixture: ComponentFixture<NavigationBarComponent>;
    let router: Router;
    let location: Location;
    const routes = {
        messaging: '/tabs/messaging',
        horseProfile: '/tabs/horse-profile',
        mapMyRide: '/tabs/map-my-ride',
        find: '/tabs/tips',
        more: '/tabs/menu'
    };
    const generalTabPath = 'tabs/horse-profiles/general-tab/:horseId';
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NavigationBarComponent, BlankComponent, SubMenuBarComponent],
            imports: [
                RouterTestingModule.withRoutes(
                    [...Object.values(routes).map(route => ({
                        path: route.replace('/', ''),
                        component: BlankComponent
                    })), {
                        path: generalTabPath,
                        component: BlankComponent,
                        data: {
                            enableSubMenu: true
                        }
                    }]
                ),
                MatIconModule,
                MatButtonModule,
                MatToolbarModule,
                MatCardModule
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NavigationBarComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        location = TestBed.get(Location);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render 5 buttons', () => {
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
        expect(buttons.length).toBe(5);
    });

    it('should have routes defined', () => {
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
        buttons.forEach(button => {
            expect(button.attributes.routerLink).toBeDefined();
            expect(button.attributes.routerDirection).toBeDefined();
            expect(button.attributes.routerDirection).toBe('root');
            expect(button.attributes.routerLinkActive).toBeDefined();
            expect(button.attributes.routerLinkActive).toBe('selected');
        });
    });

    it('should render only 1 nav-fab', async () => {
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button.nav-fab'));
        expect(buttons.length).toBe(1);
    });

    it('should render 4 nav-button', () => {
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button.nav-button'));
        expect(buttons.length).toBe(4);
    });

    it('should there not be buttons selected when route does not match', () => {
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button.selected'));
        expect(buttons.length).toBe(0);
    });

    it("should only select messaging button when navigating to it's tab", fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.messaging);
        tick();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.messaging}"]`)
        );
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.messaging);
    }));

    it('should navigate to messaging tab when clicks button', fakeAsync(() => {
        fixture.detectChanges();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.messaging}"]`)
        );
        button.nativeElement.click();
        tick();
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.messaging);
    }));

    it("should only select horse-profile button when navigating to it's tab", fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.horseProfile);
        tick();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.horseProfile}"]`)
        );
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.horseProfile);
    }));

    it('should navigate to horse-profile tab when clicks button', fakeAsync(() => {
        fixture.detectChanges();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.horseProfile}"]`)
        );
        button.nativeElement.click();
        tick();
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.horseProfile);
    }));

    it("should only select nav-fab when navigating to it's tab", fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.mapMyRide);
        tick();
        const button: DebugElement = fixture.debugElement.query(By.css('button.nav-fab'));
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.mapMyRide);
    }));

    it("should only select map-my-ride button when navigating to it's tab", fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.mapMyRide);
        tick();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.mapMyRide}"]`)
        );
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.mapMyRide);
    }));

    it('should navigate to map-my-ride tab when clicks button', fakeAsync(() => {
        fixture.detectChanges();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.mapMyRide}"]`)
        );
        button.nativeElement.click();
        tick();
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.mapMyRide);
    }));

    it("should only select find button when navigating to it's tab", fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.find);
        tick();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.find}"]`)
        );
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.find);
    }));

    it('should navigate to find tab when clicks button', fakeAsync(() => {
        fixture.detectChanges();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.find}"]`)
        );
        button.nativeElement.click();
        tick();
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.find);
    }));

    it("should only select more button when navigating to it's tab", fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.more);
        tick();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.more}"]`)
        );
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.more);
    }));

    it('should navigate to more tab when clicks button', fakeAsync(() => {
        fixture.detectChanges();
        const button: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.more}"]`)
        );
        button.nativeElement.click();
        tick();
        expect(button.classes.selected).toBe(true);
        const buttons: DebugElement[] = fixture.debugElement.queryAll(
            By.css('button:not(.selected)')
        );
        expect(buttons.length).toBe(4);
        expect(location.path()).toBe(routes.more);
    }));

    it('should not be there a messaging notification indicator', () => {
        fixture.detectChanges();
        const notificationIndicator: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.messaging}"] .requires-attention`)
        );
        expect(notificationIndicator).toBeFalsy();
    });

    it('should be there a messaging notification indicator', () => {
        component.notifications.messaging = true;
        fixture.detectChanges();
        const notificationIndicator: DebugElement = fixture.debugElement.query(
            By.css(`button[routerlink="${routes.messaging}"] .requires-attention`)
        );
        expect(notificationIndicator).not.toBeFalsy();
    });

    it('should be enable sub menu when enable from route data', fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(generalTabPath.replace(':horseId', '12345'));
        fixture.detectChanges();
        tick();
        component.enableSubMenu$.subscribe((enableSubMenu) => {
            expect(enableSubMenu).toBeTruthy();
        });
    }));

    it('should be enable sub menu when enable from route data', fakeAsync(() => {
        fixture.detectChanges();
        router.navigateByUrl(routes.mapMyRide);
        fixture.detectChanges();
        tick();
        component.enableSubMenu$.subscribe((enableSubMenu) => {
            expect(enableSubMenu).toBeFalsy();
        });
    }));
});
