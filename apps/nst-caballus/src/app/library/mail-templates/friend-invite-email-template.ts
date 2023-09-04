import { User } from '@caballus/api-common';
import { EmailTemplate } from '@rfx/nst-mailer';
import { UserProfileDto } from '../../controllers/user/dto/user-profile.dto';

export class FriendInviteEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'friend-invite-email-template.html';
    public subject: string = 'Caballus Friend Request';

    constructor(recipient: UserProfileDto, sender: User, branchUrl: string) {
        super();
        const profileLink = branchUrl;
        const recipientFirst = recipient.firstName;
        const recipientLast = recipient.lastName;
        const senderFirst = sender.profile.firstName;
        const senderLast = sender.profile.lastName;
        this.addSubstitution('profileLink', profileLink);
        this.addSubstitution('recipientFirst', recipientFirst);
        this.addSubstitution('recipientLast', recipientLast);
        this.addSubstitution('senderFirst', senderFirst);
        this.addSubstitution('senderLast', senderLast);
    }
}
