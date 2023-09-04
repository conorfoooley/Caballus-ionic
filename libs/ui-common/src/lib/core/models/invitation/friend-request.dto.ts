export class FriendRequestDto {
    public _id: string;
    public firstName: string;
    public lastName: string;
    public email: string;
    public friendRequestId: string;

    constructor(params?: Partial<FriendRequestDto>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.firstName = params.firstName || this.firstName;
            this.lastName = params.lastName || this.lastName;
            this.email = params.email || this.email;
            this.friendRequestId = params.friendRequestId || this.friendRequestId;
        }
    }
}
