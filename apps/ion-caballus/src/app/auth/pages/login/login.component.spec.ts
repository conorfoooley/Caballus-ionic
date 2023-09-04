import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '@rfx/ngx-toast';
import { Store } from '@ngxs/store';

class MockToastService {

}

class MockStore {

}

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ LoginComponent ],
            imports: [
                RouterTestingModule,
                BrowserAnimationsModule,
                IonicModule,
                FormsModule,
                ReactiveFormsModule,
                RfxFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatProgressSpinnerModule
            ],
            providers: [
                { provide: ToastService, useClass: MockToastService },
                { provide: Store, useClass: MockStore },
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
