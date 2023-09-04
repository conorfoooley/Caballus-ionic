import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ClearNavigationAction, FetchNavigationAction } from './actions';
import { patch } from '@ngxs/store/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface NavigationStateModal {
    navigation: string;
}

@State<NavigationStateModal>({
    name: 'navigation',
    defaults: {
        navigation: ''
    }
})
@Injectable({providedIn: 'root'})
export class NavigationState {
    @Selector()
    public static activeNavigation(state: NavigationStateModal): string {
        return state.navigation;
    }

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly _router: Router
    ) {
    }

    @Action(FetchNavigationAction)
    public fetchNavigation(ctx: StateContext<NavigationStateModal>): void {
        this._router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        )
        .subscribe((event) => {
            ctx.setState(patch({navigation: (event as NavigationEnd).url}));
        });
    }

    @Action(ClearNavigationAction)
    public clearNavigation(ctx: StateContext<NavigationStateModal>): void {
        ctx.setState(patch({navigation: ''}));
    }
}
