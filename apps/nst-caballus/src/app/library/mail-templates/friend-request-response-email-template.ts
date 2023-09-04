import { EmailTemplate } from '@rfx/nst-mailer';
import { UserIdentity, FriendStatus } from '@caballus/api-common';

export class FriendRequestResponseEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'friend-request-response.html';
    public subject: string = '';

    constructor(requester: UserIdentity, requestee: UserIdentity, response: FriendStatus) {
        super();

        this.subject =
            response === FriendStatus.Friends
                ? 'Caballus Friend Request Was Accepted'
                : 'Caballus-Connection Declined.';
        let description = ``;
        if (response == FriendStatus.Friends) {
            description = `Dear ${requester.label}, ${requestee.label}  has accepted the Caballus Friend Connection.  You may now be able to view their Horse List, as well as thier rides, and can be notified of their activities if you so choose.`;
        } else {
            description = `Dear ${requester.label}, ${requestee.label}  has declined the Caballus Friend Connection.  If you feel this was done in error, it is advised that you communicate with this user independently from the Caballus application before sending another invite.`;
        }
        this.addSubstitution('description', description);
    }
}
