import { HorseBreed } from '../../enums';
import { BaseMediaDocument } from '../media/base-media-document';

export class HorseBasicProfile {
    public commonName: string;
    public registeredName: string;
    public breed: HorseBreed;
    public breedOther: string;
    public registrationNumber: string;
    public heightMeters: number;
    public weightKilograms: number;
    public url: string;
    public profilePicture: BaseMediaDocument;

    constructor(params?: Partial<HorseBasicProfile>) {
        if (!!params) {
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
