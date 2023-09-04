import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { UiLibraryModule } from '@caballus/ui-library';
import { UiCommonModule, Permission } from '@caballus/ui-common';
import { SharedModule } from '@ngx-caballus/shared/shared.module';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UserListComponent } from './pages/user-list/user-list.component';
import { UserEditComponent } from './pages/user-edit/user-edit.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { PermissionGuard } from '@ngx-caballus/routes/guards';

@NgModule({
    declarations: [UserListComponent, UserEditComponent],
    imports: [
        CommonModule,
        UiLibraryModule,
        UiCommonModule,
        SharedModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatCardModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        RfxFormsModule,
        RouterModule.forChild([
            {
                path: 'list',
                component: UserListComponent,
                canActivate: [PermissionGuard],
                data: {
                    permission: Permission.UserDashboard
                }
            },
            {
                path: 'create',
                component: UserEditComponent,
                canActivate: [PermissionGuard],
                data: {
                    permission: Permission.UserCreate
                }
            },
            {
                path: 'edit/:id',
                component: UserEditComponent,
                canActivate: [PermissionGuard],
                data: {
                    permission: Permission.UserEdit
                }
            }
        ])
    ]
})
export class UserModule {}
