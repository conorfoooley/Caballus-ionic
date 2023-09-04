import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { MapMyRideComponent } from './pages/map-my-ride/map-my-ride.component';
import { HorseSelectBannerComponent } from './components/horse-select-banner/horse-select-banner.component';
import { TimeAndDistanceComponent } from './components/time-and-distance/time-and-distance.component';
import { EndRideDetailsComponent } from './pages/end-ride-details/end-ride-details.component';
import { NotesComponent } from './components/notes/notes.component';
import { CategoryComponent } from './components/category/category.component';
import { GaitProfileComponent } from './components/gait-profile/gait-profile.component';
import { ElevationComponent } from './components/elevation/elevation.component';
import { NgChartsModule } from 'ng2-charts';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    MapMyRideComponent,
    HorseSelectBannerComponent,
    TimeAndDistanceComponent,
    EndRideDetailsComponent,
    NotesComponent,
    CategoryComponent,
    GaitProfileComponent,
    ElevationComponent,
  ],
  imports: [
    SharedModule,
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
    NgChartsModule,
    RouterModule.forChild([
      {
        path: 'end-ride-details',
        component: EndRideDetailsComponent,
      },
      {
        path: '',
        component: MapMyRideComponent,
      },
    ]),
  ],
})
export class MapMyRideModule {}
