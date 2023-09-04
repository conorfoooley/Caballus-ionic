import { EmailTemplate } from '@rfx/nst-mailer';

export class VerifyRegistrationEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'verify-registration.html';
    public subject: string = 'Verify Your Caballus Account';

    constructor(token: string, branchUrl: string) {
        super();
        this.addSubstitution('url', branchUrl);
    }
}
