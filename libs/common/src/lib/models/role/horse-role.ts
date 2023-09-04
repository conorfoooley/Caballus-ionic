import { HorsePermission } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { HorseRoleIdentityWithoutIds } from './horse-role-identity';
export class HorseRoleWithoutIds extends BaseDoc {
    public _id: any;
    public name: string = '';
    public editable: boolean = false;
    public permissions: HorsePermission[] = [];

    constructor(params?: Partial<HorseRoleWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.name = params.name || this.name;
            this.editable = typeof params.editable === 'boolean'
                ? params.editable : this.editable;
            this.permissions = Array.isArray(params.permissions)
                ? params.permissions
                : this.permissions;
        }
    }

    public toIdentity(): HorseRoleIdentityWithoutIds {
        return new HorseRoleIdentityWithoutIds({
            _id: this._id,
            label: this.name
        });
    }
}
