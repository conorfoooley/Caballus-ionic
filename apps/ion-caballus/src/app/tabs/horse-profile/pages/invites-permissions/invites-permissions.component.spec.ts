import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InvitesPermissionsComponent } from './invites-permissions.component';
import { of } from 'rxjs';
import { ToastService, InvitationService, User, RoleService, HorseRole, InvitationDetailed } from '@caballus/ui-common';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { runOnPushChangeDetection } from '@ion-caballus/core/util/unit-tests';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

const mockHorseRoles = [{"createdDate":"2021-12-21T06:19:21.066Z","modifiedDate":"2021-12-21T06:19:21.066Z","status":1,"name":"Student","editable":false,"permissions":["[HorsePermission] horseView","[HorsePermission] horseEdit","[HorsePermission] horseRide"],"_id":"6131fa9fd5009c3a9218a968"},{"createdDate":"2021-12-21T06:19:21.066Z","modifiedDate":"2021-12-21T06:19:21.066Z","status":1,"name":"Trainer","editable":false,"permissions":["[HorsePermission] horseView","[HorsePermission] horseEdit","[HorsePermission] horseRide"],"_id":"6131faa0d5009c3a9218a969"}];
const mockInvites = [{"createdDate":"2021-11-23T05:29:02.504Z","modifiedDate":"2021-11-23T05:29:02.504Z","status":1,"from":{"label":"Ben Whitaker","_id":"60de4aaa4623421450ec8411","picture":{"path":"media/d000bee1-253b-45bb-91f2-417e820ecd6b","name":"hip2.jpg","type":"[MediaDocumentType] Image","jwPlayerId":"","url":"","dateUploaded":"2021-09-15T21:34:20.593Z"}},"to":{"email":"test@riafox.com","userIdentity":{"label":"Test Person","_id":"619bf70c33b6dcbadfef5a67"}},"horseIdentity":{"label":"Aardvark","_id":"6100a78d5f635611f95d22b2"},"horseRoleIdentity":{"label":"Student","_id":"6131fa9fd5009c3a9218a968"},"invitationStatus":"[InvitationStatus] sent","invitationType":"[InvitationType] general","toUserPhone":"4445556666","toUserAddress":{"line1":"test","line2":"","city":"","state":null,"postalCode":""},"_id":"619c7c1e33b6dcbadfef62e5"}];

const MockRoleService = {
    getHorseRoles: jest.fn()
};

const MockInvitationService = {
    getInvitationDetailedListByHorseId: jest.fn()
};

const MockToastService = {
	success: jest.fn(),
    error: jest.fn()
};

describe('InvitesPermissionsComponent', () => {
    let component: InvitesPermissionsComponent;
    let fixture: ComponentFixture<InvitesPermissionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                InvitesPermissionsComponent
            ],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                IonicModule,
                NgxsModule.forRoot([])
            ],
            providers: [
                { provide: RoleService, useValue: MockRoleService },
                { provide: InvitationService, useValue: MockInvitationService },
                { provide: ToastService, useValue: MockToastService },
            ],
            schemas: [NO_ERRORS_SCHEMA]
        })

            .compileComponents()

        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        MockRoleService.getHorseRoles.mockReturnValue(of(mockHorseRoles.map(hr => new HorseRole(hr as any))));
        MockInvitationService.getInvitationDetailedListByHorseId.mockReturnValue(of(mockInvites.map(i => new InvitationDetailed(i as any))));

        fixture = TestBed.createComponent(InvitesPermissionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
    });

    
    it('should display section for each role', () => {
        setupHelper();

        const cards = fixture.debugElement.queryAll(By.css('.horse-role-card'));
        expect(cards.length).toEqual(2);

        const trainerCard = cards[0];
        const trainerHeader = trainerCard.query(By.css('mat-card-title'));
        expect(trainerHeader.nativeElement.textContent).toEqual('Trainer(s):');

        const studentCard = cards[1];
        const studentHeader = studentCard.query(By.css('mat-card-title'));
        expect(studentHeader.nativeElement.textContent).toEqual('Student(s):');
        
    });

});
