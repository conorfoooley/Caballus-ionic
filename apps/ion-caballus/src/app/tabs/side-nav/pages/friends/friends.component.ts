import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FriendStatus } from '@caballus/common';
import { Friend, User } from '@caballus/ui-common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { FriendState, UserState } from '@ion-caballus/core/state';
import { FetchFriendsAction } from '@ion-caballus/core/state/actions';
import { ModalService } from '@ion-caballus/core/services';
import { takeUntil } from 'rxjs/operators';
import { AccountPageComponent } from '../account-page/account-page.component';

@Component({
    selector: 'app-friends',
    templateUrl: './friends.component.html',
    styleUrls: ['./friends.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [AccountPageComponent]
})
export class FriendsComponent implements OnInit, OnDestroy {
    @Select(UserState.user)
    public user$!: Observable<User>;

    @Select(FriendState.friends)
    public allFriends$!: Observable<Friend[]>;

    public dat$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public friendRequests$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public friendReceived$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public friends$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public blocked$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public user: User;
    public FriendStatus: typeof FriendStatus = FriendStatus;
    public allFriendsFilter$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public allFriendsData$: BehaviorSubject<Friend[]> = new BehaviorSubject<Friend[]>(null);
    public filterValue: string = 'all';

    private _onDestroy$: Subject<void> = new Subject();

    public filterStatus: boolean = false;

    constructor(
        private readonly _modalService: ModalService,
        private readonly _router: Router,
        private readonly _store: Store,
        private readonly _accountPageComponent: AccountPageComponent
    ) {}

    ngOnInit(): void {
        this.user$.pipe(takeUntil(this._onDestroy$)).subscribe(user => (this.user = user));

        this.allFriends$.subscribe({
            next: res => {
                this.dat$.next(res);
                const reqs = res.filter(f => f.friendStatus === FriendStatus.Requested && f.userIdentity._id === this.user._id);
                const received = res.filter(f => f.friendStatus === FriendStatus.Requested && f.userIdentity._id !== this.user._id);

                const friends = res.filter(f => f.friendStatus === FriendStatus.Friends);
                const blocked = res.filter(f => f.friendStatus === FriendStatus.Blocked);
                this.allFriendsFilter$.next(res);
                this.allFriendsData$.next(res);
                this.friendRequests$.next(reqs);
                this.friendReceived$.next(received);
                this.friends$.next(friends);
                this.blocked$.next(blocked);
            },
            error: e => console.error(e)
        });

        this._fetchFriends();
    }

    public navToProfile(friendRequest: Friend): void {
        if (friendRequest) {
            const targetUserId =
                  friendRequest.userIdentity._id === this.user._id
                      ? friendRequest.friendIdentity._id
                      : friendRequest.userIdentity._id;
            const params = friendRequest.friendIdentity._id;
            if (friendRequest.friendStatus === FriendStatus.Requested && friendRequest.userIdentity._id !== this.user._id) {
                this._modalService.friendRequestModal(friendRequest).subscribe(result => {
                    this._fetchFriends();
                });
            } else if (friendRequest.friendStatus === FriendStatus.Requested) {
                this._accountPageComponent._showFriendRequestPendingActionModal(friendRequest._id);
            } else if (friendRequest.friendStatus === FriendStatus.Blocked) {
                this._modalService.friendAction(friendRequest).subscribe(result => {
                    console.log({ result });
                });
            } else {
                this._router.navigate([`/tabs/menu/profile/${targetUserId}`]);
            }
        }
    }

    public filterUser(filterValue: string): void {
        this.filterValue = filterValue;
        if (filterValue === 'friends') {
            this.allFriendsFilter$.next(this.friends$.value);
        }
        if (filterValue === 'requested') {
            this.allFriendsFilter$.next(this.friendRequests$.value);
        }
        if(filterValue === 'received'){
            this.allFriendsFilter$.next(this.friendReceived$.value);
        }
        if(filterValue === 'blocked'){
            this.allFriendsFilter$.next(this.blocked$.value);
        }
        if (filterValue === 'all') {
            this.allFriendsFilter$.next(this.allFriendsData$.value);
        }
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    private _fetchFriends(): void {
        this._store.dispatch(new FetchFriendsAction());
    }
}
