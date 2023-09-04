import { EmailTemplate } from '@rfx/nst-mailer';
import { User } from '@caballus/api-common';

export class TransferSubscriptionResponseEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'transfer-subscription-response.html';
    public subject: string = '';

    constructor(subject: string, content: string) {
        super();
        this.subject = subject;
        this.addSubstitution('content', content);
    }
}
