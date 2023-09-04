import { InvitationWithoutIds } from './invitation';
import { Address } from '../base/address';

export class InvitationDetailedWithoutIds extends InvitationWithoutIds {
    public toUserPhone: string;
    public toUserAddress: Address;

    constructor(params?: Partial<InvitationDetailedWithoutIds>) {
        super(params);
        if (!!params) {
            this.toUserPhone = params.toUserPhone || this.toUserPhone;
            this.toUserAddress = !!params.toUserAddress
                ? new Address(params.toUserAddress)
                : this.toUserAddress;
        }
    }
}
