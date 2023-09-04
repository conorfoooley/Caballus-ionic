import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxsModule, Store } from '@ngxs/store';
import { NgxsEmitPluginModule } from '@ngxs-labs/emitter';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { UiLibraryModule } from '@caballus/ui-library';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { UiCommonModule } from '@caballus/ui-common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { states } from './state';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { AuthInterceptor, RFX_HTTP_AUTH_TOKEN_STREAM } from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import { guards } from './routes/guards';
import { environment } from '@ion-caballus/env';
import { ToggleHorseToRideModalComponent } from './modals/toggle-horse-to-ride-modal/toggle-horse-to-ride-modal.component';
import { UnauthorizedInterceptor } from './routes/interceptors/unauthorized.interceptor';
import { OccupiedHorseModalComponent } from './modals/occupied-horse-modal/occupied-horse-modal.component';
import { GetVideo } from './interfaces/get-video';
import { FakeVideoService } from './services';
import { DeleteHorseModalComponent } from './modals/delete-horse-modal/delete-horse-modal.component';
import { DisableHorseModalComponent } from './modals/disable-horse-modal/disable-horse-modal.component';
import { MatCardModule } from '@angular/material/card';
import { IonicModule } from '@ionic/angular';
import { MatNativeDateModule } from '@angular/material/core';
import { DeleteHorseHealthModalComponent } from './modals/delete-horse-health-modal/delete-horse-health-modal.component';
import { PhoneMaskDirective } from './directives/phone-mask.directive';
import { ImageViewer } from './modals/image-viewer/image-viewer.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ProfileImageCropperComponent } from './modals/profile-image-cropper/profile-image-cropper.component';
import { AddFriendModalComponent } from './modals/add-friend-modal/add-friend-modal.component';
import { ConfigureGpsParametersModalComponent } from './modals/configure-gps-parameters-modal/configure-gps-parameters-modal.component';
import { AlreadyFriendModalComponent } from './modals/already-friend-modal/already-friend-modal.component';
import { FriendRequestModalComponent } from './modals/friend-request-modal/friend-request-modal.component';
import { FriendActionModalComponent } from './modals/friend-action-modal/friend-action-modal.component';
import {
    VgBufferingModule,
    VgControlsModule,
    VgCoreModule,
    VgOverlayPlayModule
} from 'ngx-videogular';
import { MatSelectModule } from '@angular/material/select';
import { DeleteIncompleteRideModalComponent } from './modals/delete-incomplete-ride-modal/delete-incomplete-ride-modal.component';
import { VideoViewerModalComponent } from './modals/video-viewer-modal/video-viewer-modal.component';
import { resolvers } from './routes/resolver';

export const tokenFactory = (store: Store): Observable<string> =>
    store.select((state: any): string => state.auth.token);

@NgModule({
    declarations: [
        ToggleHorseToRideModalComponent,
        OccupiedHorseModalComponent,
        DeleteHorseModalComponent,
        DisableHorseModalComponent,
        DeleteHorseHealthModalComponent,
        PhoneMaskDirective,
        ImageViewer,
        VideoViewerModalComponent,
        AddFriendModalComponent,
        ProfileImageCropperComponent,
        ConfigureGpsParametersModalComponent,
        AlreadyFriendModalComponent,
        FriendRequestModalComponent,
        FriendActionModalComponent,
        DeleteIncompleteRideModalComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        UiLibraryModule,
        NgxsModule.forRoot(states, { developmentMode: !environment.production }),
        NgxsEmitPluginModule.forRoot(),
        NgxsReduxDevtoolsPluginModule.forRoot({
            disabled: environment.production
        }),
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        RfxFormsModule,
        UiCommonModule,
        VgCoreModule,
        VgBufferingModule,
        VgOverlayPlayModule,
        VgControlsModule,
        MatInputModule,
        MatFormFieldModule,
        NgxSliderModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatCardModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatNativeDateModule
    ],
    exports: [PhoneMaskDirective, VideoViewerModalComponent],
    providers: [
        ...guards,
        ...resolvers,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: UnauthorizedInterceptor,
            multi: true
        },
        {
            provide: RFX_HTTP_AUTH_TOKEN_STREAM,
            useFactory: tokenFactory,
            deps: [Store]
        },
        {
            provide: GetVideo,
            useClass: FakeVideoService
        },
        CommonModule
    ]
})
export class CoreModule {}
