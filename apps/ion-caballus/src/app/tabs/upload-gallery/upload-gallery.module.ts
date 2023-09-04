import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { SharedModule } from '../../shared/shared.module';
import { UploadGalleryComponent } from './upload-gallery.component';

@NgModule({
    declarations: [
        UploadGalleryComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        ReactiveFormsModule,
        RfxFormsModule,
        UiCommonModule,
        UiLibraryModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatRadioModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatCardModule,
        NgChartsModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: UploadGalleryComponent
            }
        ])
    ]
})
export class UploadGalleryModule {}
