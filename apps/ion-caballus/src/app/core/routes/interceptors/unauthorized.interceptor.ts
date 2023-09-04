import { Injectable, NgZone } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, defer, BehaviorSubject, throwError, of } from 'rxjs';
import { ToastService } from '@rfx/ngx-toast';
import {
    debounceTime,
    filter,
    tap,
    catchError,
    switchMap,
    switchMapTo,
    take
} from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { LogoutAction, RefreshAction } from '@ion-caballus/core/state/actions';
import { AuthError } from '@caballus/ui-common';

const DEBOUNCE_TIME_MS = 1000;
const HTTP_UNAUTHORIZED = 401;

@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
    private errors$: Subject<HttpErrorResponse> = new Subject();
    private _refreshTokenInProcess: boolean = false;
    private _refreshTokenSubject: BehaviorSubject<string> = new BehaviorSubject(null);

    constructor(
        private readonly _store: Store,
        private readonly _toast: ToastService,
        private readonly _router: Router,
        private readonly _ngZone: NgZone
    ) {
        this.errors$
            .pipe(
                filter(error => error.status === HTTP_UNAUTHORIZED),
                debounceTime(DEBOUNCE_TIME_MS),
                tap(err => {
                    console.warn(err);
                    if (err.error.message === AuthError.VerificationDeadlinePassed) {
                        this._toast.error('Verification deadline passed');
                        this._store.dispatch(new LogoutAction(false));
                        this._ngZone.run(() =>
                            this._router.navigateByUrl('/auth/resend-verification')
                        );
                    }
                })
            )
            .subscribe();
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Errors from grid-internal requests aren't caught...
        return next.handle(req).pipe(
            tap(undefined, err => this.errors$.next(err)),
            catchError(err => {
                // handle 401 errors
                if (err.status === HTTP_UNAUTHORIZED) {
                    if (err.error.message !== AuthError.VerificationDeadlinePassed) {
                        // handle request when refresh token is in process
                        if (this._refreshTokenInProcess) {
                            return this._refreshTokenSubject.pipe(
                                filter(result => !!result),
                                take(1),
                                switchMap(token => next.handle(this._addAuthToken(req, token)))
                            );
                        } else {
                            // set refreshTokenInProcess true
                            this._refreshTokenInProcess = true;
                            // pass nll the refresh token subject
                            this._refreshTokenSubject.next(null);

                            // dispatch refresh token action
                            return defer(() => this._store.dispatch(new RefreshAction())).pipe(
                                // get new token from the store
                                switchMapTo(this._store.select(s => s.auth.token)),
                                // fire next request with the new token
                                switchMap(token => {
                                    // reset refreshTokenInProcess to false
                                    this._refreshTokenInProcess = false;
                                    // pass new token to the refresh token subject so the pending request can use this new token
                                    this._refreshTokenSubject.next(token);
                                    // fire next request with the new token
                                    return next.handle(this._addAuthToken(req, token));
                                }),
                                catchError(err => {
                                    if (err.status === HTTP_UNAUTHORIZED) {
                                        // dispatch logout action when refresh token api fails with 401 status
                                        
                                        return this._store.dispatch(new LogoutAction(true));
                                    }
                                    // throw error if catched error is other than 401
                                    return throwError(err);
                                })
                            );
                        }
                    }
                }
                return throwError(err);
            })
        );
    }

    /**
     * It will add a given token the request header and will return the updated request object
     * @param req
     * @param token
     */
    private _addAuthToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
        return req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }
}
