import { FoodPreference, HobbieInterest } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { UserIdentityWithoutIds } from '../user/user-identity';

export class ActivityProposalWithoutIds extends BaseDoc {
    public _id: any;
    public inviterIdentity: UserIdentityWithoutIds = null;
    public recipientIdentity: UserIdentityWithoutIds = null;
    public hobbieInterest: HobbieInterest[] = [];
    public foodPreference: FoodPreference[] = [];
    public messageId: any = null;

    constructor(params: Partial<ActivityProposalWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.inviterIdentity = !!params.inviterIdentity
                ? new UserIdentityWithoutIds(params.inviterIdentity)
                : this.inviterIdentity;
            this.recipientIdentity = !!params.recipientIdentity
                ? new UserIdentityWithoutIds(params.recipientIdentity)
                : this.recipientIdentity;
            this.hobbieInterest = params.hobbieInterest || this.hobbieInterest;
            this.foodPreference = params.foodPreference || this.foodPreference;
            this.messageId = params.messageId || this.messageId;
        }
    }
}
