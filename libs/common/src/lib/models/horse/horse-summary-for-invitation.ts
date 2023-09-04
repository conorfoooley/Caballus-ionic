import { UserIdentityWithoutIds } from '../user/user-identity';
import { HorseBreed, InvitationType } from '../../enums';
import { BaseMediaDocument } from '../media/base-media-document';

export class HorseSummaryForInvitationWithoutIds {
    public _id: any;
    public invitationType: InvitationType;
    public invitationFrom: UserIdentityWithoutIds;
    public invitationToRoleName: string;
    public commonName: string = null;
    public registeredName: string = null;
    public breed: HorseBreed = null;
    public breedOther: string = null;
    public registrationNumber: string = null;
    public heightMeters: number = null;
    public weightKilograms: number = null;
    public url: string = null;
    public profilePicture: BaseMediaDocument = null;

    constructor(params?: Partial<HorseSummaryForInvitationWithoutIds>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.invitationType = params.invitationType || this.invitationType;
            this.invitationFrom = !!params.invitationFrom
                ? new UserIdentityWithoutIds(params.invitationFrom)
                : this.invitationFrom;
            this.invitationToRoleName = params.invitationToRoleName || this.invitationToRoleName;
            this.commonName = params.commonName || this.commonName;
            this.registeredName = params.registeredName || this.registeredName;
            this.breedOther = params.breedOther || this.breedOther;
            this.breed = params.breed || this.breed;
            this.registrationNumber = params.registrationNumber || this.registrationNumber;
            this.heightMeters = params.heightMeters || this.heightMeters;
            this.weightKilograms = params.weightKilograms || this.weightKilograms;
            this.url = params.url || this.url;
            this.profilePicture = !!params.profilePicture ? new BaseMediaDocument(params.profilePicture) : this.profilePicture;
        }
    }
}
