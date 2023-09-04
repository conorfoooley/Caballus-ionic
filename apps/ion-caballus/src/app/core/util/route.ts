import { RouterStateSnapshot } from '@angular/router';

export function getChildRouteData<T>(snapshot: RouterStateSnapshot, path: string, key: string): T {
    let result;
    let route = snapshot.root;
    do {
        if (route[path] && route[path][key]) {
            result = route[path][key];
        }
        route = route.firstChild;
    } while (route && !result);
    return result;
}
