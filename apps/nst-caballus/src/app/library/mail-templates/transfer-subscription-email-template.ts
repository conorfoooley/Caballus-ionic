import { EmailTemplate } from '@rfx/nst-mailer';
import { User } from '@caballus/api-common';

export class TransferSubscriptionEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'transfer-subscription.html';
    public subject: string = 'Caballus User Requests Payment Assistance';

    constructor(recipient: User, sender: User, branchUrl: string) {
        super();
        const recipientFirst = recipient.profile.firstName;
        const recipientLast = recipient.profile.lastName;
        const senderFirst = sender.profile.firstName;
        const senderLast = sender.profile.lastName;
        this.addSubstitution('recipientFirst', recipientFirst);
        this.addSubstitution('recipientLast', recipientLast);
        this.addSubstitution('senderFirst', senderFirst);
        this.addSubstitution('senderLast', senderLast);
        this.addSubstitution('transferLink', branchUrl);
    }
}
