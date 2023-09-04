import { EmailTemplate } from '@rfx/nst-mailer';

export class ForgotPasswordEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'forgot-password.html';
    public subject: string = 'Forgot Password';

    constructor(token: string, branchUrl: string) {
        super();
        this.addSubstitution('url', branchUrl);
    }
}
