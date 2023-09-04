import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ResendVerificationComponent } from './resend-verification.component';
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
import { ToastService } from '@rfx/ngx-toast';
import { AuthService } from '@caballus/ui-common';

class MockAuthService {

}

class MockToastService {

}

describe('ResendVerificationComponent', () => {
    let component: ResendVerificationComponent;
    let fixture: ComponentFixture<ResendVerificationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ResendVerificationComponent],
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
                { provide: ToastService, useClass: MockToastService }
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResendVerificationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
