import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { HorseBreed, InvitationType } from '@caballus/common';
import { HorseSummaryForInvitation, InvitationService, UserIdentity } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { HorseGeneralInvitationResponseModalComponent } from '../horse-general-invitation-response-modal/horse-general-invitation-response-modal.component';

const MockToastService = {
	success: jest.fn(),
    error: jest.fn()
};
const MockInvitationService = {
    acceptGeneralInvitation: jest.fn(),
	rejectInvitation: jest.fn()
};
const MockMatDialogRef = {
    afterClosed: jest.fn(),
    close: jest.fn()
};

const MockRouter = {
    navigateByUrl: jest.fn()
};

describe('HorseGeneralInvitationResponseModalComponent', () => {
	let component: HorseGeneralInvitationResponseModalComponent;
	let fixture: ComponentFixture<HorseGeneralInvitationResponseModalComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ HorseGeneralInvitationResponseModalComponent ],
			imports: [
				RouterModule.forRoot([])
			],
			providers: [
                { provide: InvitationService, useValue: MockInvitationService },
                { provide: ToastService, useValue: MockToastService },
                { provide: MatDialogRef, useValue: MockMatDialogRef },
				{ provide: Router, useValue: MockRouter },
                { provide: MAT_DIALOG_DATA, useValue: {
					summary: new HorseSummaryForInvitation({
						_id: 'horsey123',
						invitationType: InvitationType.General,
						invitationFrom: new UserIdentity({ label: 'Ownery Joe', _id: 'owner123'}),
						invitationToRoleName: 'Student',
						commonName: 'HohoHorsey',
						registeredName: 'ASDF',
						breed: HorseBreed.WarmBlood,
						breedOther: 'Cockapoo',
						registrationNumber: '1p2o3n4y',
						heightMeters: 123,
						weightKilograms: 456
					}),
					inviteId: 'invite123'
				} }
            ],
		})
		.compileComponents();
		jest.resetAllMocks();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(HorseGeneralInvitationResponseModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should accept invitation when accept is clicked', () => {
		MockInvitationService.acceptGeneralInvitation.mockReturnValue(of(null));

		const btn = fixture.debugElement.query(By.css('button.accept-btn'));
		btn.nativeElement.click();

		expect(MockInvitationService.acceptGeneralInvitation).toHaveBeenCalled();
	});

	it('should decline invitation when cancel is clicked', () => {
		MockInvitationService.rejectInvitation.mockReturnValue(of(null));

		const btn = fixture.debugElement.query(By.css('button.decline-btn'));
		btn.nativeElement.click();

		expect(MockInvitationService.rejectInvitation).toHaveBeenCalled();
	});

	it('should go to profile when profile link is clicked', () => {
		const btn = fixture.debugElement.query(By.css('a.profile-link'));
		btn.nativeElement.click();

		expect(MockRouter.navigateByUrl).toHaveBeenCalled();
	});

});

