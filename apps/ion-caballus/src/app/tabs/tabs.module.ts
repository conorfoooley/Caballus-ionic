import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "../shared/shared.module";
import { TabsComponent } from "./tabs.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
    declarations: [TabsComponent],
    imports: [
        SharedModule,
        FontAwesomeModule,
        RouterModule.forChild([
            {
                path: '',
                component: TabsComponent,
                children: [
                    {
                        path: 'map-my-ride',
                        loadChildren: (): any =>
                            import('./map-my-ride/map-my-ride.module').then(m => m.MapMyRideModule)
                    },
                    {
                        path: 'horse-profile',
                        loadChildren: (): any =>
                            import('./horse-profile/horse-profile.module').then(
                                m => m.HorseProfileModule
                            )
                    },
                    {
                        path: 'notifications',
                        loadChildren: (): any =>
                            import('./notifications/notifications.module').then(
                                m => m.NotificationsModule
                            )
                    },
                    {
                        path: 'menu',
                        loadChildren: (): any =>
                            import('./side-nav/side-nav.module').then(m => m.SideNavModule)
                    },
                    {
                        path: 'share-ride',
                        loadChildren: (): any =>
                            import('./share-ride/share-ride.module').then(
                                m => m.ShareRideModule
                            )
                    },
                    {
                        path: 'upload-gallery',
                        loadChildren: (): any =>
                            import('./upload-gallery/upload-gallery.module').then(
                                m => m.UploadGalleryModule
                            )
                    },
                    {
                        path: 'notification-setting',
                        loadChildren: (): any =>
                            import('./notification-setting/notification-setting.module').then(m => m.NotificationSettingModule)
                    },
                    {
                        path: '',
                        redirectTo: '/tabs/map-my-ride',
                        pathMatch: 'full'
                    }
                ]
            }
        ])
    ],
    exports: [RouterModule]
})
export class TabsModule {
}
