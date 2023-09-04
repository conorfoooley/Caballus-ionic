import { GaitNumbers, Gait } from '@caballus/common';
import { BadRequestException } from '@nestjs/common';
/**
 * Rather than a transform, this is really a validator function
 * constructed because the class-validator library doesn't support
 * validating properties on literal objects, only on classes.
 */
export function transformGaitsKilometersPerHour(dto: { [Key in Gait]?: number }): GaitNumbers {
    Object.keys(dto).forEach(k => {
        if (!(Gait.members as string[]).includes(k)) {
            throw new BadRequestException(`No such gait ${k}`);
        }
    });
    Gait.members.forEach(m => {
        if (typeof dto[m] === 'undefined') {
            throw new BadRequestException(`Missing gait ${Gait.toString(m)}`);
        }
        if (!(typeof dto[m] === 'number' && dto[m] >= 0)) {
            throw new BadRequestException(`Invalid ${Gait.toString(m)} value ${dto[m]}`);
        }
    });
    for (let _m = 0; _m < Gait.members.length - 1; ++_m) {
        const gaitA = Gait.members[_m];
        const gaitB = Gait.members[_m + 1];
        if (dto[gaitA] >= dto[gaitB]) {
            throw new BadRequestException(
                `${Gait.toString(gaitA)} cannot be faster than ${Gait.toString(gaitB)}`
            );
        }
    }
    if (dto[Gait.None] !== 0) {
        throw new BadRequestException(`${Gait.toString(Gait.None)} must be zero`);
    }
    return dto as GaitNumbers;
}
