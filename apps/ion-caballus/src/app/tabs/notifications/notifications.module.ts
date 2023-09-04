import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [NotificationsComponent],
  imports: [
    CommonModule,
    IonicModule,
    MatIconModule,
    RouterModule.forChild([
      {
        path: '',
        component: NotificationsComponent
      },
      {
        path: '**',
        redirectTo: '/tabs/notifications',
        pathMatch: 'full'
      }
    ]),
    FontAwesomeModule,
    MatButtonModule
  ]
})
export class NotificationsModule {
}
