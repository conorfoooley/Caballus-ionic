// angular route resolver

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { RefreshAction } from '@caballus/ui-state';
import { SplashScreen } from '@capacitor/splash-screen';
import { CacheService, CapacitorPluginService, StorageService } from '@ion-caballus/core/services';
import { RestoreSessionAction } from '@ion-caballus/core/state/actions';
import { Store } from '@ngxs/store';
import { forkJoin, from, Observable, of } from 'rxjs';
import { defaultIfEmpty, map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginResolver implements Resolve<any> {
  constructor(
    private _router: Router,
    private readonly _storageService: StorageService,
    private readonly _capacitorPluginService: CapacitorPluginService,
    private readonly _store: Store,
    private readonly _cacheService: CacheService,
  ) {
  }

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    return forkJoin([
      from(this._storageService.getUser()),
      from(this._storageService.getRefreshToken()),
      from(this._storageService.getAuthToken())
    ]).pipe(
      switchMap(([user, refresh, auth]) => {
        if (!!user && !!refresh && !!auth) {
          // this.submitting$.next(true);
          return this._store.dispatch(new RestoreSessionAction(user, refresh, auth)).pipe(
            switchMap(() => this._capacitorPluginService.networkStatus()),
            switchMap(network =>
              network.connected
                ? this._store.dispatch(new RefreshAction())
                : of(undefined)
            ),
            map(() => true)
          );
        } else {
          SplashScreen.hide();
          return of(false);
        }
      }),
      tap(session => {
        // fetch param from the route
        const queryParams = route.queryParams;
        // set url to navigate
        const urlToNavigate =
          queryParams && queryParams.redirect ? queryParams.redirect : null;

        if (session) {
          // start syncing the cached data
          this._cacheService.sync().subscribe();

          if (urlToNavigate) {
            if (urlToNavigate.includes('/horse-profile?id=')) {
              const splitUrl = urlToNavigate.split('/horse-profile?id=');
              const horseId = splitUrl[splitUrl.length - 1];
              this._router.navigate([
                `/tabs/horse-profile/detail-horse/general-tab/${horseId}?shared=true`
              ]);
              SplashScreen.hide();
              return of(true);
            } else {
              // navigate to the given url
              this._router.navigateByUrl(urlToNavigate);
              SplashScreen.hide();
              return of(true);
            }
          } else {
            // if no url is provided navigate to the default route
            this._router.navigate(['/tabs/map-my-ride']);
            SplashScreen.hide();
            return of(true);
          }
        }
        return defaultIfEmpty(null);
      })
    );
  }
}
