import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { UserState } from '@caballus/ui-state';
import { ToastService, Permission } from '@caballus/ui-common';

@Injectable()
export class PermissionGuard implements CanActivate {
    @Select(UserState.permissions)
    public userPermissions$: Observable<Permission[]>;

    constructor(private _router: Router, private _toast: ToastService) {}
    public canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        const reqPerm = next.data['permission'] || null;
        const requireAll: boolean = next.data['requireAll'] || false;
        const permissions: Permission[] = Array.isArray(reqPerm) ? reqPerm : [reqPerm];
        let _permissions: Permission[] = [];
        this.userPermissions$.pipe(take(1)).subscribe(perms => (_permissions = perms));
        if (!permissions || permissions.length === 0) {
            return true;
        }
        let hasPermission: boolean = true;
        if (requireAll) {
            for (const p of permissions) {
                hasPermission = hasPermission && _permissions.indexOf(p) > -1;
            }
        } else {
            hasPermission = false;
            let pI = 0;
            do {
                hasPermission = _permissions.indexOf(permissions[pI]) > -1;
            } while (hasPermission === false && _permissions[++pI]);
        }
        if (hasPermission) {
            return true;
        } else {
            this._toast.error('No Access');
            this._router.navigateByUrl('/dashboard');
            return false;
        }
    }
}
