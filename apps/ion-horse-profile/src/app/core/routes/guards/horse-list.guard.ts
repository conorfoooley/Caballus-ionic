import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { UserState } from '@caballus/ui-state';
import { ToastService } from '@rfx/ngx-toast';
import { map } from 'rxjs/operators';

@Injectable()
export class HorseListGuard implements CanActivate {
    @Select(UserState.doesUserHaveActiveSubscription)
    public doesUserHaveActiveSubscription$: Observable<boolean>;

    constructor(private readonly _toast: ToastService, private readonly _router: Router) {}

    public canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        return this.doesUserHaveActiveSubscription$.pipe(
            map(res => {
                if (!res) {
                    this._toast.error('No Access!');
                    this._router.navigate(['..']);
                }
                return res;
            })
        );
    }
}
