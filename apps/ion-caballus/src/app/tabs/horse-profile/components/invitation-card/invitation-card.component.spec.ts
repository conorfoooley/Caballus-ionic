import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InvitationCardComponent } from './invitation-card.component';
import { of } from 'rxjs';
import { InvitationRecipient, InvitationDetailed, User, Address, UserIdentity, State } from '@caballus/ui-common';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { runOnPushChangeDetection } from '@ion-caballus/core/util/unit-tests';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

const mockInviteDetailed = new InvitationDetailed({
    toUserAddress: new Address({
        line1: '33 Fake St.',
        city: 'Fakesville',
        state: State.Idaho,
        postalCode: '33333'
    }),
    to: new InvitationRecipient({
        email: 'test@riafox.com',
        userIdentity: new UserIdentity({
            label: 'Sir Test',
            _id: 'asdf'
        })
    })
});

describe('InvitationCardComponent', () => {
    let component: InvitationCardComponent;
    let fixture: ComponentFixture<InvitationCardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                InvitationCardComponent
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
        fixture = TestBed.createComponent(InvitationCardComponent);
        component = fixture.componentInstance;
        component.invitation = mockInviteDetailed;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {

    });

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
    });

    it('should display the address as one string', () => {
        setupHelper();

        const addressDiv = fixture.debugElement.query(By.css('.address > .value'));
        expect(addressDiv.nativeElement.textContent).toEqual('33 Fake St., Fakesville, ID 33333');
        
    });
});
