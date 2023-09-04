import { HorseRoleWithoutIds } from '../role/horse-role';
import { HorseConnectionSimple } from './horse-connection-simple';
import { HorseOwnerSimple } from './horse-owner-simple';

export class HorseRelationshipsSimple {
    public _id: any;
    public owner: HorseOwnerSimple;
    public trainersAndStudents: HorseConnectionSimple[] = [];
    public loggedInUserRole: HorseRoleWithoutIds;

    constructor(params?: Partial<HorseRelationshipsSimple>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.owner = !!params.owner
                ? new HorseOwnerSimple(params.owner)
                : this.owner;
            this.trainersAndStudents = Array.isArray(params.trainersAndStudents)
                ? params.trainersAndStudents.map(ts => new HorseConnectionSimple(ts))
                : this.trainersAndStudents;
            this.loggedInUserRole = !!params.loggedInUserRole
                ? new HorseRoleWithoutIds(params.loggedInUserRole)
                : this.loggedInUserRole;
        }
    }
}
