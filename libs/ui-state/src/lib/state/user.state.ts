import { Injectable } from '@angular/core';
import { User, UserService, Permission, UserToHorseSummary } from '@caballus/ui-common';
import { State, Selector, StateContext, Action } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { FetchUserAction, ClearUserAction, SeenWelcomeModalAction } from '../actions';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Receiver } from '@ngxs-labs/emitter';
import { ImmutableContext, ImmutableSelector } from '@ngxs-labs/immer-adapter';
import { NotificationSummary } from '@caballus/common';

export interface UserStateModel {
    notificationSummary: NotificationSummary;
    user: User;
}

@State<UserStateModel>({
    name: 'user',
    defaults: {
        notificationSummary: undefined,
        user: undefined
    }
})
@Injectable({providedIn: 'root'})
export class UserState {
    @Selector()
    @ImmutableSelector()
    public static user(state: UserStateModel): User {
        return state.user;
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
    public static permissions(state: UserStateModel): Permission[] {
        return !!state.user ? state.user.permissions : [];
    }

    @Selector()
    @ImmutableSelector()
    public static seenWelcomeModal(state: UserStateModel): boolean {
        return state.user.settings.seenWelcomeModal;
    }

    @Selector()
    @ImmutableSelector()
    public static horseRelations(state: UserStateModel): UserToHorseSummary[] {
        return !!state.user ? state.user.horseRelationships : [];
    }

    @Selector()
    @ImmutableSelector()
    public static notificationSummary(state: UserStateModel): NotificationSummary {
        return state.notificationSummary;
    }

    constructor(private readonly _userService: UserService) {
    }

    @Action(FetchUserAction)
    public fetchUser(ctx: StateContext<UserStateModel>, action: FetchUserAction): Observable<void> {
        return this._userService.getLoggedInUser().pipe(
            tap(user => ctx.setState({...ctx.getState(), user})),
            switchMap(() => of(void 0))
        );
    }

    @Action(ClearUserAction)
    public clearUser(ctx: StateContext<UserStateModel>, action: ClearUserAction): Observable<void> {
        ctx.setState(patch({user: undefined}));
        return of(void 0);
    }

    @Action(SeenWelcomeModalAction)
    public setWeenWelcomeModal(
        ctx: StateContext<UserStateModel>,
        action: SeenWelcomeModalAction
    ): Observable<void> {
        ctx.setState({
            ...ctx.getState(),
            user: new User({
                ...ctx.getState().user,
                settings: {
                    ...ctx.getState().user.settings,
                    seenWelcomeModal: true
                }
            })
        });
        return of(void 0);
    }

    @Receiver()
    @ImmutableContext()
    public static setNotificationSummary(
        {setState}: StateContext<UserStateModel>,
        {payload}: { payload: NotificationSummary }
    ): void {
        setState((state: UserStateModel) => {
            state.notificationSummary = payload;
            return state;
        });
    }
}
