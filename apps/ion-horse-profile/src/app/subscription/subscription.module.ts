import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentComponent } from './payment/payment.component';
import { DeleteComponent } from './delete/delete.component';
import { SubscriptionComponent } from './subscription.component';
import { IonicModule } from '@ionic/angular';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { NgxsModule } from '@ngxs/store';
import { HorseListComponent } from './horse-list/horse-list.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HorseListGuard } from '../core/routes/guards';

@NgModule({
    declarations: [PaymentComponent, DeleteComponent, SubscriptionComponent, HorseListComponent],
    imports: [
        CommonModule,
        IonicModule,
        UiCommonModule,
        UiLibraryModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatInputModule,
        NgxsModule,
        MatCardModule,
        MatIconModule,
        MatFormFieldModule,
        RouterModule.forChild([
            {
                path: 'payment',
                component: PaymentComponent
            },
            {
                path: 'delete',
                component: DeleteComponent
            },
            {
                path: 'horse-list',
                component: HorseListComponent,
                canActivate: [HorseListGuard]
            },
            {
                path: '',
                component: SubscriptionComponent
            }
        ]),
        MatProgressSpinnerModule
    ]
})
export class SubscriptionModule {}
