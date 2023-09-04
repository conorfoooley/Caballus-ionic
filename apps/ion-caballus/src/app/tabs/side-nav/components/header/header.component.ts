import { Location } from '@angular/common';
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { Friend, User } from '@caballus/ui-common';

@Component({
    selector: 'app-sidenav-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
    @Input()
    public title: string;
    @Input()
    public search: boolean;
    public searchActive: boolean = false;

    @Input()
    public filterClick: boolean;
    @Input()
    public filterIconStatus: boolean;

    @Input()
    public friends: Friend[];
    @Input()
    public blockedFriends: Friend[];

    @Output()
    public filterStatus: EventEmitter<boolean> = new EventEmitter(false);
    constructor(private location: Location) {
    }

    ngOnInit(): void {
    }

    public goBack(): void {
        this.location.back();
    }

    public activateSearch(): void {
        this.filterStatus.emit(false);
        this.searchActive = !this.searchActive;
    }

    public activateFilter(): void {
        this.searchActive = false;
        this.filterStatus.emit(!this.filterClick);
    }
}
