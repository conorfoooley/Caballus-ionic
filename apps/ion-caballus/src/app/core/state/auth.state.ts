import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@caballus/ui-common';
import { ImmutableSelector } from '@ngxs-labs/immer-adapter';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { forkJoin, from, interval, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import {
  ClearUserAction,
  FetchUserAction,
  LoginAction,
  LogoutAction,
  RefreshAction,
  RestoreSessionAction,
  SetUserAction
} from './actions';
import { Network } from '@capacitor/network';

// four and a half minutes in milliseconds
const authRefreshIntervalMs: number = 270000;
const authRefreshPollFrequencyMS: number = 5000;

interface AuthStateModel {
    token: string;
    refresh: string;
    refreshIntervalMark: number;
}

@State<AuthStateModel>({
    name: 'auth',
    defaults: {
        token: undefined,
        refresh: undefined,
        refreshIntervalMark: 0
    }
})
@Injectable({ providedIn: 'root' })
export class AuthState {

    private _refreshPollInterval$: Observable<number> =
        interval(authRefreshPollFrequencyMS);
    private _refreshCondition$: Observable<boolean> =
        this._refreshPollInterval$.pipe(
            withLatestFrom(this._store.select(state => state.auth.refreshIntervalMark)),
            withLatestFrom(this._store.select(state => state.auth.token)),
            map(([[_, mark], token]) => {
                const deltaT = new Date().getTime() - new Date(mark).getTime();
                const lapsed = deltaT >= authRefreshIntervalMs;
                const authenticated = !!token;
                return (authenticated && lapsed);
            })
        );

    constructor(
        private readonly _authService: AuthService,
        private readonly _store: Store,
        private readonly _ngZone: NgZone,
        private readonly _router: Router,
        private readonly _storageService: StorageService
    ) {}

    @Selector()
    public static authenticated(state: AuthStateModel): boolean {
        return !!state.token;
    }

    @Selector()
    @ImmutableSelector()
    public static authToken(state: AuthStateModel): string {
        return state.token;
    }

    @Selector()
    @ImmutableSelector()
    public static refreshToken(state: AuthStateModel): string {
        return state.refresh;
    }

    @Action(LoginAction)
    public login(ctx: StateContext<AuthStateModel>, action: LoginAction): Observable<void> {
        return this._authService
            .tryLogin(action.email, action.password, action.deviceInfo)
            .pipe(
                tap(tokens => ctx.setState(patch({ ...tokens }))),
                switchMap(tokens =>
                    from(this._storageService.setAuthToken(tokens.token))
                        .pipe(map(() => tokens))
                ),
                switchMap(tokens =>
                    from(this._storageService.setRefreshToken(tokens.refresh))
                ),
                switchMap(() => this._store.dispatch(new FetchUserAction())),
                map(() => undefined)
            );
    }

    @Action(LogoutAction)
    public logout(ctx: StateContext<AuthStateModel>, action: LogoutAction): Observable<void> {
        ctx.setState(patch({ token: undefined, refresh: undefined, refreshIntervalMark: 0 }));
        return this._store
            .dispatch(new ClearUserAction())
            .pipe(
                switchMap(() =>
                    forkJoin([
                        from(this._storageService.clearAuthToken()),
                        from(this._storageService.clearRefreshToken()),
                        from(this._storageService.clearAuthToken())
                    ])
                ),
                switchMap(() => action.redirect
                    ? from(this._ngZone.run(() => this._router.navigateByUrl('/auth/login')))
                    : of(undefined)
                ),
                map(() => undefined)
            );
    }

    @Action(RefreshAction)
    public refresh(ctx: StateContext<AuthStateModel>, action: RefreshAction): Observable<void> {
        return this._authService
            .refresh(`Bearer ${ctx.getState().refresh}`)
            .pipe(
                tap(token => ctx.setState(patch({ token, refreshIntervalMark: new Date().getTime() }))),
                switchMap(token => from(this._storageService.setAuthToken(token))),
                map(() => undefined),
            );
    }

    @Action(RestoreSessionAction)
    public restoreSession(ctx: StateContext<AuthStateModel>, action: RestoreSessionAction): Observable<void> {
        ctx.setState(patch({ refresh: action.refresh, token: action.token, refreshIntervalMark: 0 }));
        return this._store.dispatch(new SetUserAction(action.user))
            .pipe(map(() => undefined));
    }

    public ngxsOnInit(ctx: StateContext<AuthStateModel>): void {
        // token refresh interval
        this._refreshCondition$.pipe(
            filter(met => !!met),
            switchMap(_ => from(Network.getStatus())),
            filter(status => status.connected),
            switchMap(_ => this._store.dispatch(new RefreshAction())),
            catchError(err => {
                this._store.dispatch(new LogoutAction());
                return of(undefined);
            })
        ).subscribe();
    }
}
