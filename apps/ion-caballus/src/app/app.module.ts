import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppComponent } from "./app.component";
import { RouteReuseStrategy, RouterModule } from "@angular/router";
import { IonicModule, IonicRouteStrategy } from "@ionic/angular";
import { IonicStorageModule } from "@ionic/storage-angular";
import { Drivers } from "@ionic/storage";
import { RFX_HTTP_HOST_URL, RfxHttpModule, UrlInterceptor } from "@rfx/ngx-http";
import { ToastrModule } from "ngx-toastr";
import { RfxToastModule, ToastService } from "@rfx/ngx-toast";
import { NgxsModule, Store } from "@ngxs/store";
import { NgxsEmitPluginModule } from "@ngxs-labs/emitter";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { CoreModule } from "./core/core.module";
import { environment } from "@ion-caballus/env";
import { AuthGuard } from "./core/routes/guards";
import { UiLibraryModule } from "@caballus/ui-library";
import * as CordovaSQLiteDriver from "localforage-cordovasqlitedriver";
import { NgxSliderModule } from "@angular-slider/ngx-slider";
import { VgBufferingModule, VgControlsModule, VgCoreModule, VgOverlayPlayModule } from "ngx-videogular";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { InitAction, states } from "@ion-caballus/core/state";
import { StorageService } from "@ion-caballus/core/services";
import { LoginResolver } from "./core/routes/resolver";
import { RfxFormsModule } from "@rfx/ngx-forms";
import { CommonModule } from "@angular/common";
import { MAT_RIPPLE_GLOBAL_OPTIONS } from "@angular/material/core";

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        IonicModule.forRoot(),
        CommonModule,
        CoreModule,
        UiLibraryModule,
        NgxsModule.forRoot(states, { developmentMode: !environment.production }),
        NgxsEmitPluginModule.forRoot(),
        NgxsReduxDevtoolsPluginModule.forRoot({
            disabled: environment.production
        }),
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
        VgBufferingModule,
        RfxHttpModule,
        RfxToastModule,
        RfxFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        NgxSliderModule,
        ToastrModule.forRoot({
            tapToDismiss: true,
            newestOnTop: true,
            progressBar: true,
            progressAnimation: 'decreasing',
            timeOut: 5000,
            extendedTimeOut: 1000,
            easeTime: 300
        }),
        RouterModule.forRoot(
            [
                {
                    path: 'auth',
                    loadChildren: (): any => import('./auth/auth.module').then(m => m.AuthModule),
                    resolve: [
                        LoginResolver
                    ]
                },
                {
                    path: 'tabs',
                    canActivate: [AuthGuard],
                    loadChildren: (): any =>
                        import('./tabs/tabs.module').then(m => m.TabsModule)
                },
                {
                    path: '**',
                    redirectTo: '/auth/login'
                }
            ],
            { initialNavigation: 'enabledBlocking' }
        ),
        IonicStorageModule.forRoot({
            driverOrder: [CordovaSQLiteDriver._driver, Drivers.IndexedDB, Drivers.LocalStorage]
        })
    ],
    providers: [
        ToastService,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: UrlInterceptor,
            multi: true
        },
        {
            provide: RFX_HTTP_HOST_URL,
            useValue: environment.webserver
        },
        {
            provide: APP_INITIALIZER,
            useFactory: (storageService: StorageService, store: Store) =>
                async () => {
                    await storageService.init();
                    await store.dispatch(new InitAction()).toPromise();
                },
            deps: [StorageService, Store],
            multi: true
        },
        {provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: {disabled: true}}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
