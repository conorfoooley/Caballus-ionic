import { EmailTemplate } from '@rfx/nst-mailer';
import { User } from '@caballus/api-common';

export class SubscriptionCancelEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'subscription-cancel.html';
    public subject: string = 'Caballus 3rd Party Payment - Terminated';

    constructor(recipient: User) {
        super();
        this.addSubstitution('recipientFirst', recipient.profile.firstName);
        this.addSubstitution('recipientLast', recipient.profile.lastName);
    }
}
