import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NotificationSettingComponent } from './pages/notification-setting/notification-setting.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@NgModule({
    declarations: [NotificationSettingComponent],
    imports: [
        CommonModule,
        IonicModule,
        MatIconModule,
        MatCardModule,
        MatCheckboxModule,
        MatButtonModule,
        FormsModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        RfxFormsModule,
        RouterModule.forChild([
            {
                path: '',
                component: NotificationSettingComponent
            },
            {
                path: '**',
                redirectTo: '/tabs/notification-setting',
                pathMatch: 'full'
            }
        ])
    ]
})
export class NotificationSettingModule {}
