import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { HorseService, HorseSummaryForInvitation, InvitationType, ModalService, UiCommonModule, User, UserHorseRelationshipAction } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HorseListComponent } from './horse-list.component';
import { ToastService } from '@rfx/ngx-toast';
import { HorseCache } from '@ion-caballus/core/caches';
import { runOnPushChangeDetection } from '@ion-caballus/core/util';
import { BehaviorSubject, of } from 'rxjs';
import { NgxsModule, Store } from '@ngxs/store';
import { ActivatedRoute, Router } from '@angular/router';

const MockToastService = {
    error: jest.fn(),
    success: jest.fn()
};
const MockHorseCache = {
    getHorsesForList: jest.fn(),
};

const MockActivateRoute = {
    queryParamMap: new BehaviorSubject({
        get: (): boolean => true
    }),
    paramMap: new BehaviorSubject({
        get: (): string => 'invite123'
    }),
};

const MockHorseService = {
    getHorseSummaryByInvitationId: jest.fn()
};

const MockModalService = {
    ownershipTransferResponse: jest.fn(),
    generalInvitationResponse: jest.fn()
};

const MockRouter = {
    navigateByUrl: jest.fn(),
    navigate: jest.fn()
};


describe('HorseListComponent', () => {
    let component: HorseListComponent;
    let fixture: ComponentFixture<HorseListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                HorseListComponent,
            ],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                CommonModule,
                IonicModule,
                FormsModule,
                ReactiveFormsModule,
                RfxFormsModule,
                UiCommonModule,
                UiLibraryModule,
                MatInputModule,
                MatFormFieldModule,
                MatIconModule,
                MatProgressSpinnerModule,
                MatCheckboxModule,
                NgxsModule.forRoot([])
            ],
            providers: [
                { provide: HorseCache, useValue: MockHorseCache },
                { provide: ToastService, useValue: MockToastService },
                { provide: ActivatedRoute, useValue: MockActivateRoute },
                { provide: Router, useValue: MockRouter },
                { provide: HorseService, useValue: MockHorseService },
                { provide: ModalService, useValue: MockModalService }
            ]
        })
            .compileComponents();

        const store: Store = TestBed.get(Store);
        store['select'] = jest.fn(() => of(new User()));
    }));

    const setupHelper = async (): Promise<void> => {
        fixture = TestBed.createComponent(HorseListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await runOnPushChangeDetection(fixture);
    };

    beforeEach(() => {
        MockHorseCache.getHorsesForList.mockReturnValue(of([]));
        MockHorseService.getHorseSummaryByInvitationId.mockReturnValue(of(new HorseSummaryForInvitation({
            invitationType: InvitationType.OwnershipTransfer
        })));
        MockModalService.ownershipTransferResponse.mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of(UserHorseRelationshipAction.Reject))
        });
    });

    it('should create', () => {
        setupHelper();
        expect(component).toBeTruthy();
    });

    it('should refresh list in ionViewDidEnter if doRefresh return true', () => {
        MockActivateRoute.queryParamMap.next({ get: () => true });
        const spyNextMethod = spyOn(component.horsesProfilesData$, 'next');
        component.ionViewDidEnter();
        expect(spyNextMethod).toBeCalledWith([]);
    })

    it('should not refresh list in ionViewDidEnter if doRefresh return false', () => {
        MockActivateRoute.queryParamMap.next({ get: () => false });
        const spyNextMethod = spyOn(component.horsesProfilesData$, 'next');
        component.ionViewDidEnter();
        expect(spyNextMethod).not.toBeCalledWith([]);
    })

    it('should open invitation modal if invitationId is present', async () => {
        MockActivateRoute.paramMap.next({ get: () => 'invite123' });
        expect(MockModalService.ownershipTransferResponse).toBeCalled();
    })

});
