import { HorseVeterinarianProfile, Address, State } from '@caballus/api-common';

export const mockHorseVeterinarianProfile: HorseVeterinarianProfile = new HorseVeterinarianProfile({
    fullName: 'John Doe',
    email: 'jonh@doe.com',
    phone: '+1234567890',
    address: new Address({
        line1: 'Test 1',
        line2: 'Test 2',
        state: State.Alabama,
        city: 'Test'
    })
});
