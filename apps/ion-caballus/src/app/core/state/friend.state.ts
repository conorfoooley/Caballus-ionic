import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ClearFriendsAction, FetchFriendsAction } from './actions';
import { Friend, FriendService } from '@caballus/ui-common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { patch } from '@ngxs/store/operators';

export interface FriendStateModal {
    friends: Friend[];
}

@State<FriendStateModal>({
    name: 'friend',
    defaults: {
        friends: []
    }
})
@Injectable({providedIn: 'root'})
export class FriendState {
    @Selector()
    public static friends(state: FriendStateModal): Friend[] {
        return state.friends;
    }

    constructor(private readonly _friendService: FriendService) {
    }

    @Action(FetchFriendsAction)
    public fetchFriends(ctx: StateContext<FriendStateModal>): Observable<Friend[]> {
        return this._friendService.getAllFriends().pipe(
            tap(friends => {
                ctx.setState(patch({friends: friends}));
            }),
            map(() => undefined),
        );
    }

    @Action(ClearFriendsAction)
    public clearFriends(ctx: StateContext<FriendStateModal>): void {
        ctx.setState({friends: []});
    }
}
