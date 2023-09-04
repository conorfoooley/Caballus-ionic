import { HorseBreed, HorseProfileStatus } from '../../enums';
import { BaseMediaDocument } from '../media/base-media-document';
import { HorseProfilePrivacy } from './horse-profile-privacy';

export class HorseProfile {
    public privacy: HorseProfilePrivacy = new HorseProfilePrivacy();
    public profileStatus: HorseProfileStatus;
    public commonName: string;
    public registeredName: string;
    public breed: HorseBreed;
    public breedOther: string;
    public registrationNumber: string;
    public heightMeters: number;
    public weightKilograms: number;
    public url: string;
    public profilePicture: BaseMediaDocument;
    public endDateTime: Date;

    constructor(params?: Partial<HorseProfile>) {
        if (!!params) {
            this.privacy = !!params.privacy
                ? new HorseProfilePrivacy(params.privacy)
                : this.privacy;
            this.profileStatus = params.profileStatus || this.profileStatus;
            this.commonName = params.commonName || this.commonName;
            this.registeredName = params.registeredName || this.registeredName;
            this.breedOther = params.breedOther || this.breedOther;
            this.breed = params.breed || this.breed;
            this.registrationNumber = params.registrationNumber || this.registrationNumber;
            this.heightMeters = params.heightMeters || this.heightMeters;
            this.weightKilograms = params.weightKilograms || this.weightKilograms;
            this.url = params.url || this.url;
            this.profilePicture = !!params.profilePicture ? new BaseMediaDocument(params.profilePicture) : this.profilePicture;
            this.endDateTime = params.endDateTime || this.endDateTime;
        }
    }
}
