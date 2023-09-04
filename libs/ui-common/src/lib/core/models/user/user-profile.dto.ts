export class UserProfileDto {
    public _id: string;
    public firstName: string;
    public lastName: string;
    public email: string;

    constructor(params?: Partial<UserProfileDto>) {
        if (!!params) {
            this._id = params._id || this._id;
            this.firstName = params.firstName || this.firstName;
            this.lastName = params.lastName || this.lastName;
            this.email = params.email || this.email;
        }
    }
}
