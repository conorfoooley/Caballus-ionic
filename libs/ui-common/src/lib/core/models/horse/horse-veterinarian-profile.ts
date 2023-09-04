import { Address } from '@caballus/common';


export class HorseVeterinarianProfile {
    public fullName: string = '';
    public email: string = '';
    public phone: string = '';
    public address: Address = new Address();

    constructor(params?: Partial<HorseVeterinarianProfile>) {
        if (!!params) {
            this.fullName = params.fullName || this.fullName;
            this.email = params.email || this.email;
            this.phone = params.phone || this.phone;
            this.address = !!params.address ? new Address(params.address) : this.address;
        }
    }
}
