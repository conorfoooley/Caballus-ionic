import { EmailTemplate } from '@rfx/nst-mailer';
import { UserIdentity, HorseIdentity, UserHorseRelationshipAction } from '@caballus/api-common';

export class HorseTransferResponseEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'horse-transfer-response.html';
    public subject: string = 'Caballus Horse Transfer';

    constructor(originalOwner: UserIdentity, newOwner: UserIdentity, horse: HorseIdentity, response: UserHorseRelationshipAction) {
        super();

        this.subject = `${this.subject} ${UserHorseRelationshipAction.toString(response)}`;
        this.addSubstitution('prevOwner', originalOwner.label);
        this.addSubstitution('newOwner', newOwner.label);
        this.addSubstitution('horseName', horse.label);
        this.addSubstitution('action', UserHorseRelationshipAction.toString(response).toLowerCase());
    }
}
