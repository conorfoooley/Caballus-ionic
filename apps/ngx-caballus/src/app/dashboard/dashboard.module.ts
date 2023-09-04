import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { SharedModule } from '@ngx-caballus/shared/shared.module';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { DashboardRedirectGuard } from '@ngx-caballus/routes/guards';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
    declarations: [AdminComponent],
    exports: [],
    imports: [
        CommonModule,
        SharedModule,
        UiCommonModule,
        UiLibraryModule,
        NgChartsModule,
        MatGridListModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        RouterModule.forChild([
            {
                path: 'admin',
                component: AdminComponent
            },
            {
                path: '',
                pathMatch: 'full',
                canActivate: [DashboardRedirectGuard]
            }
        ])
    ]
})
export class DashboardModule {}
