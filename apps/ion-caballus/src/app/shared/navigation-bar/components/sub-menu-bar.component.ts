import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getChildRouteData } from '@ion-caballus/core/util/route';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { map, startWith, takeUntil, tap } from 'rxjs/operators';
import {DataService} from "@ion-caballus/core/services/data-service";
const MENU_SLIDE_DOME_TIME = 3000;
@Component({
    selector: 'app-sub-menu-bar',
    templateUrl: './sub-menu-bar.component.html',
    styleUrls: ['./sub-menu-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubMenuBarComponent implements OnInit, OnDestroy {
    private _onDestroy$: Subject<void> =
        new Subject();
    public showHideMenu$: BehaviorSubject<boolean> = new BehaviorSubject(true);
    public horseId$: Observable<boolean> = this._router.events.pipe(
        takeUntil(this._onDestroy$),
        startWith(this._router),
        map(() => getChildRouteData(this._router.routerState.snapshot, 'params', 'horseId'))
    );
    constructor(private readonly _router: Router,
                private readonly _dataService: DataService) {
    }

    public ngOnInit(): void {
        timer(MENU_SLIDE_DOME_TIME).pipe(
            tap(() => {
                this.showHideSubMenu(false);
            })
        ).subscribe();
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }

    public onBottomMenuClick(): void {
        this.showHideMenu$.next(false);
        this._dataService.isChecked$.subscribe( value => this.showHideMenu$.next(value))
    }

    public showHideSubMenu(showHideMenu: boolean): void {
        this.showHideMenu$.next(showHideMenu);
    }
}
