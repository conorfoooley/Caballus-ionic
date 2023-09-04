import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { NotificationPageComponent } from './pages/notifications/notification.component';
import { MyHorsesPageComponent } from './pages/my-horses-page/my-horses-page.component';
import { FriendsComponent } from './pages/friends/friends.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { HeaderComponent } from './components/header/header.component';
import { UserRideHistoryComponent } from './pages/user-ride-history/user-ride-history.component';
import { ViewUserRideDetailComponent } from './pages/view-user-ride-detail/view-user-ride-detail.component';
import { SharedModule } from '../../shared/shared.module';
import { AddRideHistoryComponent } from '../../shared/add-ride-history/add-ride-history.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RfxFormsModule } from '@rfx/ngx-forms';

@NgModule({
    declarations: [
        SideNavComponent,
        AccountPageComponent,
        MyHorsesPageComponent,
        NotificationPageComponent,
        FriendsComponent,
        UserSearchComponent,
        HeaderComponent,
        UserRideHistoryComponent,
        ViewUserRideDetailComponent
    ],
    imports: [
        CommonModule,
        MatListModule,
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        FontAwesomeModule,
        ScrollingModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: SideNavComponent
            },
            {
                path: 'myprofile',
                component: AccountPageComponent
            },
            {
                path: 'notifications',
                redirectTo: '/tabs/notifications',
                pathMatch: 'full'
            },
            {
                path: 'profile/:id',
                component: AccountPageComponent
            },
            {
                path: 'profile/:id/:friendRequestId',
                component: AccountPageComponent
            },
            {
                path: 'friends',
                component: FriendsComponent
            },
            {
                path: 'my-horses',
                component: MyHorsesPageComponent
            },
            {
                path: 'my-horses/:id',
                component: MyHorsesPageComponent
            },
            {
                path: 'my-ride-history',
                component: UserRideHistoryComponent
            },
            {
                path: 'my-ride-history/:id',
                component: UserRideHistoryComponent
            },
            {
                path: 'ride-history-detail/:horseId',
                component: ViewUserRideDetailComponent
            },
            {
                path: 'ride-history-add',
                component: AddRideHistoryComponent
            }
        ]),
        MatProgressSpinnerModule,
        RfxFormsModule
    ]
})
export class SideNavModule {}
