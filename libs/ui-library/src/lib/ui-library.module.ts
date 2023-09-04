import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import './icons';
import { SecuredHeaderComponent } from './components/secured-header/secured-header.component';
import { SecuredSidebarComponent } from './components/secured-sidebar/secured-sidebar.component';
import { SecuredFooterComponent } from './components/secured-footer/secured-footer.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { BannerComponent } from './components/banner/banner.component';
import { ReactiveFormsModule } from '@angular/forms';
import { faArrowLeft, faArrowRight, faBell, faCog, faFilter, faPlusCircle, faShareAlt, faSignOut, faStar, faUpload, faUser, faUsers, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { faTimes, faThumbTack } from '@fortawesome/pro-regular-svg-icons';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatListModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule
  ],
  declarations: [
    SecuredHeaderComponent,
    SecuredSidebarComponent,
    SecuredFooterComponent,
    PageHeaderComponent,
    BannerComponent
  ],
  exports: [
    FontAwesomeModule,
    MatButtonModule,
    MatTooltipModule,
    MatListModule,
    SecuredHeaderComponent,
    SecuredSidebarComponent,
    SecuredFooterComponent,
    PageHeaderComponent,
    BannerComponent
  ]
})
export class UiLibraryModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faBell,
      faCog,
      faUpload,
      faUser,
      faArrowLeft,
      faArrowRight,
      faSignOut,
      faShareAlt,
      faUsers,
      faStar,
      faTimes,
      faPlusCircle,
      faFilter,
      faThumbTack,
      faChevronRight
    );
  }
}
