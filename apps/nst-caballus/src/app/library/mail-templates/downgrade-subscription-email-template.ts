import { EmailTemplate } from '@rfx/nst-mailer';
import { User } from '@caballus/api-common';

export class DowngradeSubscriptionEmailTemplate extends EmailTemplate {
    public fileDestination: string = `${__dirname}/assets/email`;
    public fileName: string = 'downgrade-subscription.html';
    public subject: string = 'Attention: Caballus Subscription Downgraded to Free Version';

    constructor(
        owner: User,
    ) {
        super();
        this.addSubstitution('ownerFirst', owner.profile.firstName);
        this.addSubstitution('ownerLast', owner.profile.lastName);
    }
}
