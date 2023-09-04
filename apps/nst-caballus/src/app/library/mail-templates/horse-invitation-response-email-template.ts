import { EmailTemplate } from '@rfx/nst-mailer';
import { UserIdentity, HorseIdentity, UserHorseRelationshipAction } from '@caballus/api-common';

export class HorseInvitationResponseEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'horse-invitation-response.html';
    public subject: string = 'Caballus Horse Invitation';

    constructor(
        owner: UserIdentity,
        inviteToUser: UserIdentity,
        horse: HorseIdentity,
        response: UserHorseRelationshipAction,
        inviteToRoleName: string
    ) {
        super();

        this.subject = `${this.subject} ${UserHorseRelationshipAction.toString(response)}`;
        this.addSubstitution('owner', owner.label);
        this.addSubstitution('inviteToUser', inviteToUser.label);
        this.addSubstitution('horseName', horse.label);
        this.addSubstitution('role', inviteToRoleName);
        this.addSubstitution('action', UserHorseRelationshipAction.toString(response).toLowerCase());
    }
}
