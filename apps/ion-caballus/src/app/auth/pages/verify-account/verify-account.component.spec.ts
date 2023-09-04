import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { VerifyAccountComponent } from './verify-account.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@caballus/ui-common';
import { ToastService } from '@rfx/ngx-toast';
import { Store } from '@ngxs/store';

class MockAuthService {

}

class MockToastService {

}

class MockStore {

}

describe('VerifyAccountComponent', () => {
    let component: VerifyAccountComponent;
    let fixture: ComponentFixture<VerifyAccountComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [VerifyAccountComponent],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                IonicModule,
                FormsModule,
                ReactiveFormsModule,
                RfxFormsModule,
                UiCommonModule,
                UiLibraryModule,
                MatInputModule,
                MatFormFieldModule,
                MatProgressSpinnerModule
            ],
            providers: [
                { provide: AuthService, useClass: MockAuthService },
                { provide: ToastService, useClass: MockToastService },
                { provide: Store, useClass: MockStore }
            ]    
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VerifyAccountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
