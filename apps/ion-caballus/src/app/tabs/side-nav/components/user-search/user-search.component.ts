import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Friend, User, UserProfile, UserService } from '@caballus/ui-common';
import { ModalService } from '@ion-caballus/core/services';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { Select, Store } from '@ngxs/store';
import { FetchFriendsAction } from '@ion-caballus/state/actions';
import { UserState } from '@ion-caballus/core/state';
import { FriendStatus } from '@caballus/common';

@Component({
    selector: 'app-user-search',
    templateUrl: './user-search.component.html',
    styleUrls: ['./user-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSearchComponent implements OnInit {
    public searchTerm$: BehaviorSubject<string> = new BehaviorSubject(null);
    public baseOptions$: BehaviorSubject<UserProfile[]> = new BehaviorSubject([]);
    public allUsers$: BehaviorSubject<UserProfile[]> = new BehaviorSubject(null);
    public searchControl: FormControl = new FormControl(null);

    private _onDestroy$: Subject<void> = new Subject();

    @Select(UserState.user)
    public user$!: Observable<User>;
    @Input()
    public friends: Friend[];
    @Input()
    public blockedFriends: Friend[];

    private _user: User;

    constructor(
        private readonly _userService: UserService,
        private readonly _modalService: ModalService,
        private readonly _store: Store
    ) {
    }

    ngOnInit(): void {
        this.user$.subscribe(u => {
            this._user = u;
            this._userService
                .getAllUsers()
                .pipe(takeUntil(this._onDestroy$))
                .subscribe(res => {
                    if (this._user) {
                        // filter out logged in user
                        res = res.filter(user => user._id !== this._user._id);
                    }

                    // filter our existing friends
                    res = res.filter(user => {
                        return !this.friends.some(friend => {
                            if (friend.friendStatus === FriendStatus.Friends) {
                                return (
                                    friend.friendIdentity._id === user._id ||
                                    friend.userIdentity._id === user._id
                                );
                            } else {
                                // include user if  friend status is not Friends
                                return false;
                            }
                        });
                    });
                    this.allUsers$.next(res);
                });
        });

        this.searchControl.valueChanges
            .pipe(
                filter(value => value.length >= 3),
                debounceTime(300),
                tap(res => this.searchTerm$.next(res.toLowerCase()))
            )
            .subscribe(() => {
                if (this.allUsers$ && this.allUsers$.value) {
                    const out = this.allUsers$.value
                        .filter(p => p.firstName !== undefined )
                        .filter(
                            p =>
                                this.blockedFriends.findIndex(
                                    b => p._id === b.friendIdentity._id
                                ) === -1
                        )
                        .filter(p => p.firstName.toLowerCase().startsWith(this.searchTerm$.value)
                            || p.lastName.toLowerCase().startsWith(this.searchTerm$.value)
                            || p.email.toLowerCase().startsWith(this.searchTerm$.value));
                    this.baseOptions$.next(out);
                }
            });
    }

    public toggle(o: UserProfile): void {
        const friend = this.friends.find(f => f.friendIdentity._id === o._id);
        if (!friend) {
            this._modalService
                .sendFriendRequest(o)
                .pipe(
                    take(1),
                    switchMap(({requestSent}) =>
                        requestSent ? this._store.dispatch(new FetchFriendsAction()) : of(undefined)
                    )
                )
                .subscribe();
        } else {
            this._modalService
                .alreadyFriend(friend)
                .pipe(
                    take(1),
                    switchMap(({cancelRequest}) =>
                        cancelRequest
                            ? this._store.dispatch(new FetchFriendsAction())
                            : of(undefined)
                    )
                )
                .subscribe();
        }
    }
}
