import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AuthInterceptor, RFX_HTTP_AUTH_TOKEN_STREAM, RFX_HTTP_HOST_URL, RfxHttpModule, UrlInterceptor } from '@rfx/ngx-http';
import { AppComponent } from './app.component';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ToastService, UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';
import { IonicStorageModule } from '@ionic/storage-angular';
import { ToastrModule } from 'ngx-toastr';
import { NgxsModule } from '@ngxs/store';
import { sharedStates } from '@caballus/ui-state';
import { Observable, of } from 'rxjs';
import { paramsStream } from './shared';
import { RfxToastModule } from '@rfx/ngx-toast';
import { NgxStripeModule } from 'ngx-stripe';
import { CoreModule } from './core/core.module';

export const tokenFactory = (): Observable<string> => paramsStream.getValue() ? of(paramsStream.getValue().token) : of(null);

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        IonicModule.forRoot(),
        CoreModule,
        CommonModule,
        RfxHttpModule,
        RfxToastModule,
        UiCommonModule,
        UiLibraryModule,
        ToastrModule.forRoot({
            tapToDismiss: true,
            newestOnTop: true,
            progressBar: true,
            progressAnimation: 'decreasing',
            timeOut: 5000,
            extendedTimeOut: 1000,
            easeTime: 300
        }),
        NgxsModule.forRoot(sharedStates, {developmentMode: !environment.production}),
        BrowserAnimationsModule,
        NgxStripeModule.forRoot(environment.stripeKey),
        RouterModule.forRoot(
            [
                {
                    path: 'horse-profile',
                    loadChildren: (): any =>
                        import('./horse-profile/horse-profile.module').then(m => m.HorseModule)
                },
                {
                    path: 'my-account',
                    loadChildren: (): any =>
                        import('./subscription/subscription.module').then(m => m.SubscriptionModule)
                },
                {
                    pathMatch: 'full',
                    path: '',
                    redirectTo: 'my-account'
                }
            ],
            {initialNavigation: 'enabledBlocking'}
        ),
        IonicStorageModule.forRoot()
    ],
    providers: [
        ToastService,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        {
            provide: RFX_HTTP_AUTH_TOKEN_STREAM,
            useFactory: tokenFactory
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: UrlInterceptor,
            multi: true
        },
        {
            provide: RFX_HTTP_HOST_URL,
            useValue: environment.webserver
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
