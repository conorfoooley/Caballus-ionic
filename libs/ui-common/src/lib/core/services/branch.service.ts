import { Injectable } from '@angular/core';
import { BranchDeepLinks } from 'capacitor-branch-deep-links';
import { AuthService } from './auth.service';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import { environment } from '@ion-caballus/env';
import { Browser } from '@capacitor/browser';
import { ToastService } from '@rfx/ngx-toast';
import { CapacitorPluginService } from '@ion-caballus/core/services/capacitor-plugin.service'
@Injectable({
    providedIn: 'root'
})
export class BranchService {
    constructor(
        private readonly _authService: AuthService,
        private readonly _toastService: ToastService,
        private readonly _capacitorPluginService: CapacitorPluginService,
    ) {}

    public async generateDeepLink(
        host: string,
        route: string,
        feature: string = 'shareApp'
    ): Promise<string> {
        // generate deep link for the app
        return BranchDeepLinks.generateShortUrl({
            analytics: {
                feature
            },
            properties: {
                $desktop_url: `${host}${route}`,
                custom_string: route
            }
        })
            .then(res => res.url)
            .catch(err => {
                console.log('Error: ' + JSON.stringify(err));
                return `${host}${route}`;
            });
    }

    public async generateNewDeepLink(
        shareUrl: string,
        route: string,
        feature: string = 'shareApp'
    ): Promise<string> {
        // generate deep link for the app
        return BranchDeepLinks.generateShortUrl({
            analytics: {
                feature
            },
            properties: {
                $desktop_url: shareUrl,
                custom_string: route
            }
        })
            .then(res => res.url)
            .catch(err => {
                console.log('Error: ' + JSON.stringify(err));
                return shareUrl;
            });
    }

    /**
     * generateLinkAndOpenPwaApp
     * It will generate the deep link, and it will open the pwa app
     * @param params
     */
    public generateLinkAndOpenPwaApp(params: string = ''): Observable<any> {
        // generate account subscription token
        return this._authService.generateAccountSubscriptionToken().pipe(
            map(tokenResponse => (tokenResponse.token ? tokenResponse.token : null)),
            filter(token => !!token),
            switchMap(token =>
                // Generate deeplink of the pwa
                from(
                    this.generateDeepLink(
                        environment.ionBaseUrl,
                        `/tabs/map-my-ride`,
                        'subscriptionApp'
                    )
                ).pipe(
                    map(deepLink => ({
                        token,
                        deepLink
                    }))
                )
            ),
            // open PWA app
            switchMap(data =>
                from(
                    Browser.open({
                        url: `${environment.ionHorseProfileUrl}?token=${data.token}&deepLink=${data.deepLink}${params}`
                    })
                )
            ),
            catchError(err => {
                // show error message
                this._toastService.error(err && err.error ? err.error.message : err);
                return of(err);
            })
        );
    }

    /**
     * Go to my account page
     */

    public async goToMyAccountPWAPage() {
         // check network status
         const networkStatus = await this._capacitorPluginService
         .networkStatus()
         .toPromise();
     if (networkStatus.connected) {
         // fire subscription token generation api
         const tokenResponse = await this._authService
             .generateAccountSubscriptionToken()
             .toPromise();
         if (tokenResponse.token) {
             const deeplink = await this.generateDeepLink(
                 environment.ionBaseUrl,
                 `/tabs/map-my-ride`,
                 'subscriptionApp'
             );
             // open PWA app
             Browser.open({
                 url: `${environment.ionHorseProfileUrl}?token=${tokenResponse.token}&deepLink=${deeplink}`
             });
         } else {
             // throw error when token generation fails
             this._toastService.error('Token generation failed');
         }
     } else {
         // throw error when network is not connected
         this._toastService.error(
             'You are offline. Account Management is only available when connected to the internet.'
         );
     }
    }
}
