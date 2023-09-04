import { BaseMediaDocument, FriendStatus, FriendWithoutIds } from "@caballus/common";
import { UserIdentity } from "../user/user-identity";


export class Friend extends FriendWithoutIds {
    friendIdentity: UserIdentity;
    userIdentity: UserIdentity;
    firstName: string;
    lastName: string;
    userName: string;
    profilePicture: BaseMediaDocument;
    friendStatus: FriendStatus;
    uniqueIdentifier: string;
    constructor(params?: Partial<Friend>) {
        super(params);
        this.friendIdentity = !!params.friendIdentity
            ? new UserIdentity(params.friendIdentity)
            : this.friendIdentity;
        this.userIdentity = !!params.userIdentity
            ? new UserIdentity(params.userIdentity)
            : this.userIdentity;
        this.firstName = params.firstName || this.firstName;
        this.lastName = params.lastName || this.lastName;
        this.userName = params.userName || this.userName;
        this.profilePicture = !!params.profilePicture
            ? new BaseMediaDocument(params.profilePicture)
            : this.profilePicture;
        this.friendStatus = params.friendStatus || this.friendStatus;
        this.uniqueIdentifier =  `${this.friendIdentity._id.toString()}_${this.userIdentity._id.toString()}`
    }
}