import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SubMenuBarComponent } from './navigation-bar/components/sub-menu-bar.component';
import { NavigationBarComponent } from './navigation-bar/navigation-bar.component';
import { NotificationBannerComponent } from './notification-banner/notification-banner.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//for ride-detail component
import { RideDetailComponent } from './ride-detail/ride-detail.component';
import { ProfileHeaderComponent } from '../tabs/horse-profile/components/profile-header/profile-header.component';
import { NgChartsModule } from 'ng2-charts';
//for add-ride-history component
import { AddRideHistoryComponent } from './add-ride-history/add-ride-history.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  RideMediaUploadComponent
} from './ride-media-upload/ride-media-upload.component';
import { MatInputModule } from '@angular/material/input';
import { RfxFormsModule } from '@rfx/ngx-forms';
//
//for ride-entry-detail component
import { RideDetailEntryComponent } from './ride-entry-detail/ride-entry-detail.component';
import { UserProfileImageModalComponent } from '../core/modals/user-profile-modal/user-profile-modal.component';
import { UnsavedChangeModalComponent } from '../core/modals/unsaved-changes-modal/unsaved-changes-modal.component';
import { QuickAddHorseModalComponent } from '../core/modals/quick-add-horse-modal/quick-add-horse-modal.component';
import { PromptMsgModalComponent } from '../core/modals/prompt-msg-modal/prompt-msg-modal.component';
import { NotificationModalComponent } from '../core/modals/notification-modal/notification-modal.component';
import { MediaPreviewModalComponent } from '../core/modals/media-preview-modal/media-preview-modal.component';
import {
  HorseProfileImageModalComponent
} from '../core/modals/horse-profile-image-modal/horse-profile-image-modal.component';
import { HorseMatrixModalComponent } from '../core/modals/horse-matrix-modal/horse-matrix-modal.component';
import { HorseHealthModalComponent } from '../core/modals/horse-health-modal/horse-health-modal.component';
import {
  HorseCompetitionImageModalComponent
} from '../core/modals/horse-competition-image-modal/horse-competition-image-modal.component';
import { EndRideShareModalComponent } from '../core/modals/end-ride-share-modal/end-ride-share-modal.component';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VgBufferingModule, VgControlsModule, VgCoreModule, VgOverlayPlayModule } from 'ngx-videogular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RideAnalyticsComponent } from './ride-analytics/ride-analytics.component';
import { MapComponent } from './map/map.component';
import { GoogleMapsModule } from '@angular/google-maps';

//
@NgModule({
  declarations: [
    NavigationBarComponent,
    NotificationBannerComponent,
    SubMenuBarComponent,
    RideDetailComponent,
    RideDetailEntryComponent,
    ProfileHeaderComponent,
    AddRideHistoryComponent,
    RideMediaUploadComponent,
    QuickAddHorseModalComponent,
    UnsavedChangeModalComponent,
    UserProfileImageModalComponent,
    PromptMsgModalComponent,
    NotificationModalComponent,
    MediaPreviewModalComponent,
    HorseProfileImageModalComponent,
    HorseMatrixModalComponent,
    HorseHealthModalComponent,
    HorseCompetitionImageModalComponent,
    EndRideShareModalComponent,
    RideAnalyticsComponent,
    MapComponent
  ],
  imports: [
    CommonModule,
    UiLibraryModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    IonicModule,
    MatCardModule,
    NgChartsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    RfxFormsModule,
    NgxSliderModule,
    MatProgressSpinnerModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    VgControlsModule,
    VgCoreModule,
    MatDatepickerModule,
    GoogleMapsModule
  ],
  exports: [
    CommonModule,
    IonicModule,
    NavigationBarComponent,
    NotificationBannerComponent,
    SubMenuBarComponent,
    RideDetailComponent,
    ProfileHeaderComponent,
    AddRideHistoryComponent,
    RideMediaUploadComponent,
    RideDetailEntryComponent,
    RideAnalyticsComponent,
    MapComponent
  ]
})
export class SharedModule {
}
