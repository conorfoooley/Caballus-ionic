import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService, AuthService } from '@caballus/ui-common';
import { FormBuilder } from '@angular/forms';
import { ToastService } from '@rfx/ngx-toast';
import { Store } from '@ngxs/store';

class MockUserService {

}

class MockAuthService {

}

class MockToastService {

}

class MockStore {

}

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [RegisterComponent],
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
                MatIconModule,
                MatProgressSpinnerModule,
                MatCheckboxModule
            ],
            providers: [
                { provide: AuthService, useClass: MockAuthService },
                { provide: UserService, useClass: MockUserService },
                { provide: ToastService, useClass: MockToastService },
                { provide: Store, useClass: MockStore }
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
