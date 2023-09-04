import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthState } from '@ion-caballus/core/state';

@Injectable()
export class AuthGuard implements CanActivate {
    @Select(AuthState.authenticated)
    private _authenticated$!: Observable<boolean>;

    constructor(private readonly _router: Router) {
    }

    public canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this._authenticated$.pipe(
            take(1),
            map(authenticated => {
                if (!authenticated) {
                    this._router.navigate(['/auth/login'], {
                        queryParams: {
                            redirect: state.url.length > 1 ? state.url : ''
                        }
                    });
                }
                return authenticated;
            })
        );
    }
}
