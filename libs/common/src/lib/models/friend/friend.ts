import { FriendStatus } from "../../enums";
import { BaseDoc } from "../base/base-doc";
import { BaseMediaDocument } from "../media/base-media-document";
import { UserIdentityWithoutIds } from "../user/user-identity";


export class FriendWithoutIds extends BaseDoc {
    public _id: any;
    public friendIdentity: UserIdentityWithoutIds;
    public userIdentity: UserIdentityWithoutIds;
    public firstName: string;
    public lastName: string;
    public userName: string;
    public profilePicture: BaseMediaDocument;
    public friendStatus: FriendStatus;

    constructor(params?: Partial<FriendWithoutIds>) {
        super(params);
        this._id = params._id || this._id
        this.friendIdentity = !!params.friendIdentity
            ? new UserIdentityWithoutIds(params.friendIdentity)
            : this.friendIdentity;
        this.userIdentity = !!params.userIdentity
            ? new UserIdentityWithoutIds(params.userIdentity)
            : this.userIdentity;
        this.firstName = params.firstName || this.firstName;
        this.lastName = params.lastName || this.lastName;
        this.userName = params.userName || this.userName;
        this.profilePicture = !!params.profilePicture
            ? new BaseMediaDocument(params.profilePicture)
            : this.profilePicture;
        this.friendStatus = params.friendStatus || this.friendStatus;
    }
}