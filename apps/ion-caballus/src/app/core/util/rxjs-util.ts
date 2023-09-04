import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
/*
    I struggled for several hours against the concatMap() and concat()
    operator functions and could not find a combination that satisfied
    the type checker - I found a github thread suggesting that perhaps
    something might be wrong? https://github.com/ReactiveX/rxjs/issues/4697

    The sequence of operators below constructs an array of Observable<T>
    which is then transformed into a new observable pipe containing a
    switchMap for each entry - this will force the subscriptions to happen
    in sequence, each one waiting for the previous to complete

    Pat D Oct 14 2021
*/
export function serialSwitchMap<T = void>(observables: Observable<T>[]): Observable<T> {
    if (observables.length === 0) {
        return of(undefined);
    }
    let piped: Observable<T> = null;
    for (const o of observables) {
        piped = !piped
            ? o
            : piped.pipe(switchMap(() => o));
    }
    return piped;
}
