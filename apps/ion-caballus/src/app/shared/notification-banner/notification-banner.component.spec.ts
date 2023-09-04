import { CommonModule } from '@angular/common';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IonicModule, IonItem, IonLabel } from '@ionic/angular';

import { NotificationBannerComponent } from './notification-banner.component';

describe('NotificationBannerComponent', () => {
    let component: NotificationBannerComponent;
    let fixture: ComponentFixture<NotificationBannerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NotificationBannerComponent],
            imports: [IonicModule, CommonModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NotificationBannerComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should not render when message parameter is not present', () => {
        fixture.detectChanges();
        const children = fixture.debugElement.queryAll(By.all());
        expect(children).toBeDefined();
        expect(children.length).toBe(0);
    });

    it('should not render when message parameter length is 0', () => {
        const message = '';
        component.message = message;
        fixture.detectChanges();
        const children = fixture.debugElement.queryAll(By.all());
        expect(children).toBeDefined();
        expect(children.length).toBe(0);
    });

    it('should not render when message parameter is falsy', () => {
        const message = null;
        component.message = message;
        fixture.detectChanges();
        const children = fixture.debugElement.queryAll(By.all());
        expect(children).toBeDefined();
        expect(children.length).toBe(0);
    });

    it('should render when message parameter is present', () => {
        const message = 'Hi';
        component.message = message;
        fixture.detectChanges();
        const children = fixture.debugElement.queryAll(By.all());
        expect(children).toBeDefined();
        expect(children.length).toBe(3);
    });

    it('should render the message parameter passed in a label inside the component', () => {
        const message = 'Hi';
        component.message = message;
        fixture.detectChanges();
        const label = fixture.debugElement.query(By.css('ion-label'));
        expect(label).toBeDefined();
        expect(label.properties.innerHTML).toContain(message);
        expect(fixture.componentInstance.message).toBe(message);
    });

    it('should render an icon', () => {
        const message = 'Hi';
        component.message = message;
        fixture.detectChanges();
        const icon = fixture.debugElement.query(By.css('span'));
        expect(icon).toBeDefined();
        expect(icon.classes['material-icons']).toBeTruthy();
        expect(icon.properties.innerHTML).toContain('warning');
        expect(icon.attributes['slot']).toBe('start');
    });
});
