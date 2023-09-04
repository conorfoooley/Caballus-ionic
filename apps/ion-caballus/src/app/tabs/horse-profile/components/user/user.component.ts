import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { InvitationStatus } from '@caballus/common';
import { User } from '@caballus/ui-common';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent implements OnInit {
    public readonly InvitationStatus: typeof InvitationStatus = InvitationStatus;
    @Input() public user$: BehaviorSubject<User>;
    constructor() {}

    public ngOnInit(): void {}
}
