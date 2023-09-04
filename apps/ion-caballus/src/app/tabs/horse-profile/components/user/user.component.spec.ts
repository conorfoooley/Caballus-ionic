import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { UserComponent } from './user.component';
import { of } from 'rxjs';
import { User } from '@caballus/ui-common';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { runOnPushChangeDetection } from '@ion-caballus/core/util/unit-tests';
import { NO_ERRORS_SCHEMA } from '@angular/core';


describe('UserComponent', () => {
    let component: UserComponent;
    let fixture: ComponentFixture<UserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                UserComponent
            ],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                IonicModule,
                NgxsModule.forRoot([])
            ],
            providers: [],
            schemas: [NO_ERRORS_SCHEMA]
        })

            .compileComponents()

        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        fixture = TestBed.createComponent(UserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {

    });

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
    });
});
