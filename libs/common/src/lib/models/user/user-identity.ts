import { IdentityWithoutIds } from '../base/identity';

export class UserIdentityWithoutIds extends IdentityWithoutIds {
    public _id: any;

    constructor(params?: Partial<UserIdentityWithoutIds>) {
        super(params);
    }
}
