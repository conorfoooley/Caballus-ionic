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
import { AppHorseDetail } from '@caballus/ui-common';
import { SubMenuBarComponent } from './sub-menu-bar.component';
const horseId = 'xxxxxx'
const routes = {
    [AppHorseDetail.General]: '/tabs/horse-profile/detail-horse/general-tab/:horseId',
    [AppHorseDetail.Analytics]: '/tabs/horse-profile/detail-horse/analytics/:horseId',
    [AppHorseDetail.History]: '/tabs/horse-profile/detail-horse/ride-history/:horseId',
    [AppHorseDetail.Competitions]: '/tabs/horse-profile/detail-horse/Competitions/:horseId',
    [AppHorseDetail.Evaluations]: '/tabs/horse-profile/detail-horse/Evaluations/:horseId',
    [AppHorseDetail.Medical]: '/tabs/horse-profile/detail-horse/medical/:horseId',
};
@Component({
    template: ''
})
class BlankComponent { }

describe('SubMenuBarComponent', () => {
    let component: SubMenuBarComponent;
    let fixture: ComponentFixture<SubMenuBarComponent>;
    let router: Router;
    let location: Location;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SubMenuBarComponent, BlankComponent],
            imports: [
                RouterTestingModule.withRoutes(
                    Object.values(routes).map(route => ({
                        path: route.replace('/', ''),
                        component: BlankComponent,
                    }))
                ),
                MatIconModule,
                MatButtonModule,
                MatToolbarModule,
                MatCardModule
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SubMenuBarComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        location = TestBed.get(Location);
        router.navigateByUrl(routes[AppHorseDetail.General].replace(':horseId', horseId));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render 6 sub menu icons', () => {
        fixture.detectChanges();
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('.mene-icon-label'));
        expect(buttons.length).toBe(6);
    });

    it('should render 0 sub menu icons on hide', () => {
        fixture.detectChanges();
        component.showHideSubMenu(false);
        fixture.detectChanges();
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('.mene-icon-label'));
        expect(buttons.length).toBe(0);
    });

    it('should render 6 sub menu icons on show', () => {
        fixture.detectChanges();
        component.showHideSubMenu(true);
        fixture.detectChanges();
        const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('.mene-icon-label'));
        expect(buttons.length).toBe(6);
    });

    it('should navigate to sub menu when clicks sub menu div', fakeAsync(() => {
        fixture.detectChanges();
        const button: DebugElement = fixture.debugElement.query(By.css('.ride-history'));
        button.nativeElement.click();
        tick();
        expect(location.path()).toEqual(routes[AppHorseDetail.History].replace(':horseId', horseId));
    }));
});
