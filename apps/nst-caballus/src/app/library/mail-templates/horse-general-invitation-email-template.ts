import { EmailTemplate } from '@rfx/nst-mailer';
import { Horse, User, UserIdentity } from '@caballus/api-common';
import { ObjectId } from '@rfx/nst-db/mongo';

export class HorseGeneralInvitationEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'horse-general-invitation.html';
    public subject: string = 'Invitation To Be';

    constructor(owner: User, horse: Horse, invitationId: ObjectId, toRoleName: string, toUserIdentity: UserIdentity, branchUrl: string) {
        super();

        this.subject = `${this.subject} ${toRoleName} for ${horse.profile.commonName}`;

        this.addSubstitution('toUserName', toUserIdentity.label);
        this.addSubstitution('transferLink', branchUrl);
        this.addSubstitution('ownerFirst', owner.profile.firstName);
        this.addSubstitution('ownerLast', owner.profile.lastName);
        this.addSubstitution('commonName', horse.profile.commonName);
        this.addSubstitution('toRoleName', toRoleName);
    }
}
