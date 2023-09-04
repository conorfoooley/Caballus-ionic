
export class HorseConnectionSimple {
    public firstName: string;
    public lastName: string;
    public email: string;
    public phone: string;

    constructor(params?: Partial<HorseConnectionSimple>) {
        if (!!params) {
            this.firstName = params.firstName || this.firstName;
            this.lastName = params.lastName || this.lastName;
            this.email = params.email || this.email;
            this.phone = params.phone || this.phone;
        }
    }
}
