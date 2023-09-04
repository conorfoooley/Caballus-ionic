export class UserSettings {
    public acceptedTerms: boolean = false;
    public seenWelcomeModal: boolean = false;
    public verifiedEmail: boolean = false;
    public verifyEmailDeadline: Date;
    public completedOneRide: boolean = false;
    public showSubscriptionCancelledPopup: boolean = false;
    public uploadUsingCellularData: boolean = false;

    constructor(params?: Partial<UserSettings>) {
        if (!!params) {
            this.acceptedTerms = params.acceptedTerms || this.acceptedTerms;
            this.seenWelcomeModal = params.seenWelcomeModal || this.seenWelcomeModal;
            this.completedOneRide = params.completedOneRide || this.completedOneRide;
            this.verifiedEmail = params.verifiedEmail || this.verifiedEmail;
            this.uploadUsingCellularData = params.uploadUsingCellularData || this.uploadUsingCellularData;
            this.showSubscriptionCancelledPopup =
                params.showSubscriptionCancelledPopup || this.showSubscriptionCancelledPopup;
            this.verifyEmailDeadline = !!params.verifyEmailDeadline
                ? new Date(params.verifyEmailDeadline)
                : this.verifyEmailDeadline;
        }
    }
}
