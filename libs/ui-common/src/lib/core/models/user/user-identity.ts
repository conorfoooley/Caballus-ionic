
import { Identity } from '../base/identity';

export class UserIdentity extends Identity {
    public email?: string = '';

    constructor(params?: Partial<UserIdentity>) {
        super(params);

        if (!!params) {
            this.email = params.email || this.email;
        }
    }
}
