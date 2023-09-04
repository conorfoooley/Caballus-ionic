import {
    Component,
    ChangeDetectionStrategy,
    Input,
    HostBinding,
    Output,
    EventEmitter
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ReplaySubject, Observable } from 'rxjs';
import { startWith, distinctUntilChanged, scan, shareReplay, tap, map } from 'rxjs/operators';
import { MenuItem } from '@caballus/ui-common';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface SidebarState {
    arrowType: 'arrow-alt-from-left' | 'arrow-alt-to-left';
    opened: boolean;
    menuItems: MenuItem[];
    expandedItem: MenuItem;
    pinned: boolean;
    tooltipDelay: number;
}

@Component({
    selector: 'caballus-secured-sidebar',
    templateUrl: './secured-sidebar.component.html',
    styleUrls: ['./secured-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecuredSidebarComponent {
    @HostBinding('class.open')
    private get _opened(): boolean {
        let val: boolean;
        this.opened$.subscribe(opened => (val = opened));
        return val;
    }
    @Input()
    public set opened(value: boolean) {
        this._state.next({ opened: coerceBooleanProperty(value) } as SidebarState);
    }
    @Input()
    public set menuItems(value: MenuItem[]) {
        if (!Array.isArray(value)) {
            value = [];
        }
        this._state.next({ menuItems: value } as SidebarState);
    }

    @Output()
    public toggle: EventEmitter<boolean | void> = new EventEmitter<boolean | void>();

    private _initialState: SidebarState = {
        arrowType: 'arrow-alt-from-left',
        opened: false,
        menuItems: [],
        expandedItem: null,
        pinned: false,
        tooltipDelay: 500
    };
    // prettier-ignore
    private _state: ReplaySubject<SidebarState>
        = new ReplaySubject<SidebarState>();

    public state$: Observable<SidebarState> = this._state.asObservable().pipe(
        startWith(this._initialState),
        scan(
            (sidebarState: SidebarState, command): SidebarState => ({ ...sidebarState, ...command })
        ),
        shareReplay(1)
    );
    public opened$: Observable<boolean> = this.state$.pipe(
        map<SidebarState, boolean>(x => x?.opened),
        distinctUntilChanged(),
        tap(opened =>
            this._state.next({ arrowType: opened ? 'arrow-alt-to-left' : 'arrow-alt-from-left' } as SidebarState)
        )
    );
    public arrowIcon$: Observable<IconProp> = this.state$.pipe(
        map<SidebarState, IconProp>(x => ['far', x?.arrowType]),
        distinctUntilChanged()
    );
    public menuItems$: Observable<MenuItem[]> = this.state$.pipe(
        map<SidebarState, MenuItem[]>(x => x?.menuItems),
        distinctUntilChanged()
    );
    public expandedItem$: Observable<MenuItem> = this.state$.pipe(
        map<SidebarState, MenuItem>(x => x?.expandedItem),
        distinctUntilChanged()
    );
    public pinned$: Observable<boolean> = this.state$.pipe(
        map<SidebarState, boolean>(x => x?.pinned),
        distinctUntilChanged()
    );

    public toggleOpen(shouldOpen?: boolean): void {
        this.toggle.emit(shouldOpen);
        if (!shouldOpen) {
            this._state.next({ expandedItem: null } as SidebarState);
        }
    }

    public expandItem(opened: boolean, expandedItem: MenuItem, item: MenuItem): void {
        if (!opened) {
            this.toggle.emit(true);
        }
        this._state.next({ expandedItem: !opened || item !== expandedItem ? item : null } as SidebarState);
    }

    public pin(shouldPin: boolean, event: MouseEvent): void {
        event.stopPropagation();
        this._state.next({ pinned: shouldPin } as SidebarState);
    }
}
