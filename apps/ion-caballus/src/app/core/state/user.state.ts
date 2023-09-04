import { Injectable } from '@angular/core';
import { State, StateContext, Selector, Action, Store } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { ImmutableContext, ImmutableSelector } from '@ngxs-labs/immer-adapter';
import {
    FetchUserAction,
    ClearUserAction,
    SetUserAction,
    SetTourAction,
    GetTourAction,
    ResetShowSubscriptionCancelledPopup
} from './actions';
import { User, UserService } from '@caballus/ui-common';
import { StorageService } from '../services/storage.service';
import { of, Observable, from } from 'rxjs';
import { tap, switchMap, catchError, map } from 'rxjs/operators';
import { Receiver } from '@ngxs-labs/emitter';
import { NotificationSummary } from '@caballus/common';

export interface UserStateModel {
    notificationSummary: NotificationSummary;
    user: User;
    tour: boolean;
}

@State<UserStateModel>({
    name: 'user',
    defaults: {
        notificationSummary: undefined,
        user: undefined,
        tour: null
    }
})
@Injectable({ providedIn: 'root' })
export class UserState {
    @Selector()
    @ImmutableSelector()
    public static user(state: UserStateModel): User {
        return new User(state.user);
    }

    @Selector()
    @ImmutableSelector()
    public static doesUserHaveActiveSubscription(state: UserStateModel): boolean {
        return (
            !!state.user &&
            !!state.user.billing &&
            !!state.user.billing.subscription &&
            state.user.billing.subscription.status === 'active'
        );
    }

    @Selector()
    @ImmutableSelector()
    public static notificationSummary(state: UserStateModel): NotificationSummary {
        return state.notificationSummary;
    }

    @Selector()
    @ImmutableSelector()
    public static tour(state: UserStateModel): boolean {
        return state.tour;
    }

    @Selector()
    @ImmutableSelector()
    public static showSubscriptionCancelledPopup(state: UserStateModel): boolean {
        return state.user.settings.showSubscriptionCancelledPopup;
    }

    @Selector()
    @ImmutableSelector()
    public static uploadUsingCellularData(state: UserStateModel): boolean {
        return state.user.settings.uploadUsingCellularData;
    }

    constructor(
        private readonly _userService: UserService,
        private readonly _storageService: StorageService,
        private readonly _store: Store
    ) {}

    @Action(FetchUserAction)
    public fetchUser(ctx: StateContext<UserStateModel>, action: FetchUserAction): Observable<void> {
        return this._userService.getLoggedInUser().pipe(
            tap(user => ctx.setState({ ...ctx.getState(), user })),
            switchMap(user => from(this._storageService.setUser(user))),
            switchMap(() => of(undefined))
        );
    }

    @Action(ClearUserAction)
    public clearUser(ctx: StateContext<UserStateModel>, action: ClearUserAction): Observable<void> {
        ctx.setState(patch({ user: undefined }));
        return from(this._storageService.clearUser());
    }

    @Action(GetTourAction)
    public async getTour(ctx: StateContext<UserStateModel>, action: GetTourAction) {
        const tour = await this._storageService.getTour();
        ctx.setState(patch({ tour }));
    }

    @Action(SetTourAction)
    public setTour(ctx: StateContext<UserStateModel>, action: SetTourAction): Observable<void> {
        ctx.setState({ ...ctx.getState(), tour: false });
        return from(this._storageService.setTour());
    }

    @Action(SetUserAction)
    public setUser(ctx: StateContext<UserStateModel>, action: SetUserAction): Observable<void> {
        ctx.setState(patch({ user: action.user }));
        return from(this._storageService.setUser(action.user));
    }

    @Receiver()
    @ImmutableContext()
    public static setNotificationSummary(
        { setState }: StateContext<UserStateModel>,
        { payload }: { payload: NotificationSummary }
    ): void {
        setState((state: UserStateModel) => {
            state.notificationSummary = payload;
            return state;
        });
    }

    @Action(ResetShowSubscriptionCancelledPopup)
    public resetShowSubscriptionCancelledPopup(
        ctx: StateContext<UserStateModel>
    ): Observable<void> {
        return this._userService
            .resetShowSubscriptionCancelledPopupFlag(ctx.getState().user._id)
            .pipe(
                switchMap(() => this._store.dispatch(new FetchUserAction())),
                map(() => undefined),
                catchError(err => {
                    console.log(err);
                    return of(err);
                })
            );
    }
}
