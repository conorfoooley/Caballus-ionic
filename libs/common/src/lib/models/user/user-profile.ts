import { callbackify } from 'util';
import { Address } from '../base/address';
import { BaseMediaDocument } from '../media/base-media-document';
import { UserDisciplines } from '../../enums/user/disciplines';
// import { UserWithoutIds } from './user';
// import { UserIdentityWithoutIds } from '../user/user-identity';

export class UserProfileWithoutIds {
    public _id: any;
    public firstName: string;
    public lastName: string;
    public email: string;
    public phone: string;
    public url: string;
    public profilePicture: BaseMediaDocument;
    public address: Address;
    public disciplines: UserDisciplines[];

    constructor(params?: Partial<UserProfileWithoutIds>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.firstName = params.firstName || this.firstName;
            this.lastName = params.lastName || this.lastName;
            this.email = params.email || this.email;
            this.phone = params.phone || this.phone;
            this.url = params.url || this.url;
            this.profilePicture = !!params.profilePicture
                ? new BaseMediaDocument(params.profilePicture)
                : this.profilePicture;
            this.address = !!params.address ? new Address(params.address) : this.address;
            this.disciplines = Array.isArray(params.disciplines)
                ? params.disciplines
                : this.disciplines;
        }
    }
}

// export class UserProfileWithoutIds extends UserWithoutIds {
//     public lastRiderIdentity: UserIdentityWithoutIds;

//     constructor(params?: Partial<UserProfileWithoutIds) {
//         super(params);
//         if (!!params) {
//             this.lastRiderIdentity = !!params.lastRiderIdentity ? new UserIdentityWithoutIds(params.lastRiderIdentity) : this.lastRiderIdentity;
//         }
//     }
// }
