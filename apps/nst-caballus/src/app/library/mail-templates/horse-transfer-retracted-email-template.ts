import { EmailTemplate } from '@rfx/nst-mailer';
import { HorseBreed, Horse, User, kgToLbs, meterToHands } from '@caballus/api-common';

export class HorseTransferRetractedEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'horse-transfer-retracted.html';
    public subject: string = 'Caballus Horse Transfer Cancelled';

    constructor(owner: User, horse: Horse) {
        super();
        const ownerFirst = owner.profile.firstName;
        const ownerLast = owner.profile.lastName;
        const commonName = horse.profile.commonName;
        const registeredName = horse.profile.registeredName;
        const breed = HorseBreed.toString(horse.profile.breed);
        const registrationNumber = horse.profile.registrationNumber;
        const weight = kgToLbs(horse.profile.weightKilograms).toFixed(0);
        const height = meterToHands(horse.profile.heightMeters).toFixed(1);
        this.addSubstitution('ownerFirst', ownerFirst);
        this.addSubstitution('ownerLast', ownerLast);
        this.addSubstitution('commonName', commonName);
        this.addSubstitution('registeredName', registeredName);
        this.addSubstitution('breed', breed);
        this.addSubstitution('registrationNumber', registrationNumber);
        this.addSubstitution('weight', String(weight));
        this.addSubstitution('height', String(height));
    }
}
