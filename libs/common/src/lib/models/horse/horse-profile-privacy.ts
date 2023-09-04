import { Privacy } from '../../enums';

export class HorseProfilePrivacy {
    // When overallPrivacy is Private, all other values should be ignored (essentailly all are private)
    // All other selections apply only when overallPrivacy is Public
    // Other selections will still be retained as is (rather than being overwritten to Privacy.Private) since they are still displayed in ui
    public overallPrivacy: Privacy = Privacy.Private;
    public bio: Privacy = Privacy.Private;
    public media: Privacy = Privacy.Private;
    public rideHistory: Privacy = Privacy.Private;
    public studentsAndTrainers: Privacy = Privacy.Private;
    public ownerDetails: Privacy = Privacy.Private;
    public gaitTotals: Privacy = Privacy.Private;
    public gaitSettings: Privacy = Privacy.Private;
    public medicalHistory: Privacy = Privacy.Private;
    public performanceEvaluations: Privacy = Privacy.Private;
    public competitions: Privacy = Privacy.Private;

    constructor(params?: Partial<HorseProfilePrivacy>) {
        if (!!params) {
            this.overallPrivacy = params.overallPrivacy || this.overallPrivacy;
            this.bio = params.bio || this.bio;
            this.media = params.media || this.media;
            this.rideHistory = params.rideHistory || this.rideHistory;
            this.studentsAndTrainers = params.studentsAndTrainers || this.studentsAndTrainers;
            this.ownerDetails = params.ownerDetails || this.ownerDetails;
            this.gaitTotals = params.gaitTotals || this.gaitTotals;
            this.gaitSettings = params.gaitSettings || this.gaitSettings;
            this.medicalHistory = params.medicalHistory || this.medicalHistory;
            this.performanceEvaluations = params.performanceEvaluations || this.performanceEvaluations;
            this.competitions = params.competitions || this.competitions;
        }
    }
}
