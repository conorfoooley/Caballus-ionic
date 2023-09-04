import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { HorseBreed, InvitationType } from '@caballus/common';
import { HorseSummaryForInvitation, InvitationService, UserIdentity } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';

import { HorseOwnershipTransferResponseModalComponent } from './horse-ownership-transfer-response-modal.component';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

const MockToastService = {
	success: jest.fn(),
    error: jest.fn()
};
const MockInvitationService = {
    acceptOwnershipTransferInvitation: jest.fn(),
	rejectInvitation: jest.fn()
};
const MockMatDialogRef = {
    afterClosed: jest.fn(),
    close: jest.fn()
};

const MockRouter = {
    navigateByUrl: jest.fn()
};

describe('HorseOwnershipTransferResponseModalComponent', () => {
	let component: HorseOwnershipTransferResponseModalComponent;
	let fixture: ComponentFixture<HorseOwnershipTransferResponseModalComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ HorseOwnershipTransferResponseModalComponent ],
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
						invitationType: InvitationType.OwnershipTransfer,
						invitationFrom: new UserIdentity({ label: 'Ownery Joe', _id: 'owner123'}),
						invitationToRoleName: 'Owner',
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
		fixture = TestBed.createComponent(HorseOwnershipTransferResponseModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should accept transfer when accept is clicked', () => {
		MockInvitationService.acceptOwnershipTransferInvitation.mockReturnValue(of(null));

		const btn = fixture.debugElement.query(By.css('button.accept-btn'));
		btn.nativeElement.click();

		expect(MockInvitationService.acceptOwnershipTransferInvitation).toHaveBeenCalled();
	});

	it('should cancel transfer when cancel is clicked', () => {
		MockInvitationService.rejectInvitation.mockReturnValue(of(null));

		const btn = fixture.debugElement.query(By.css('button.cancel-btn'));
		btn.nativeElement.click();

		expect(MockInvitationService.rejectInvitation).toHaveBeenCalled();
	});

	it('should go to profile when profile link is clicked', () => {
		const btn = fixture.debugElement.query(By.css('a.profile-link'));
		btn.nativeElement.click();

		expect(MockRouter.navigateByUrl).toHaveBeenCalled();
	});

});
