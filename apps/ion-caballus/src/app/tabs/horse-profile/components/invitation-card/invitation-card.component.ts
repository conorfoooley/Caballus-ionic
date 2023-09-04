import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { InvitationDetailed, InvitationStatus, Address } from '@caballus/ui-common';

@Component({
    selector: 'app-invitation-card',
    templateUrl: './invitation-card.component.html',
    styleUrls: ['./invitation-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitationCardComponent {
    public readonly InvitationStatus: typeof InvitationStatus = InvitationStatus;

    @Input()
    public invitation: InvitationDetailed;

    @Output()
    public retractInviteId: EventEmitter<string> = new EventEmitter(null);

    constructor() {
    }

    public getAddressString(address: Address): string {
        let str = '';

        if (!!address) {
            if (!!address.line1) {
                str = !!str ? str + ', ' : str;
                str += address.line1;
            }

            if (!!address.line2) {
                str = !!str ? str + ', ' : str;
                str += address.line2;
            }

            if (!!address.city) {
                str = !!str ? str + ', ' : str;
                str += address.city;
            }

            if (!!address.state) {
                str = !!str ? str + ', ' : str;
                str += address.state;
            }

            if (!!address.postalCode) {
                str = !!str ? str + ' ' : str; // No comma
                str += address.postalCode;
            }
        }

        return str;
    }

    public retractInvite(id: string): void {
        this.retractInviteId.emit(id);
    }

}
