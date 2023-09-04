import {
    Injectable,
} from '@nestjs/common';
import { HorseRoleRepository } from './horse-role.repository';
import { HorseRole } from '@caballus/api-common';
import { ObjectId } from '@rfx/nst-db/mongo';
import { MapClass } from '@rfx/nst-common';

@Injectable()
export class HorseRoleService {
    constructor(
        private readonly _horseRoleRepo: HorseRoleRepository
    ) {}

    @MapClass(HorseRole)
    public async getDefaultCreatorRole(): Promise<HorseRole> {
        return this._horseRoleRepo.getDefaultCreatorRole();
    }

    @MapClass(HorseRole)
    public async getOwnerRole(): Promise<HorseRole> {
        return this._horseRoleRepo.getOwnerRole();
    }

    @MapClass(HorseRole)
    public async getTrainerRole(): Promise<HorseRole> {
        return this._horseRoleRepo.getTrainerRole();
    }

    @MapClass(HorseRole)
    public async getStudentRole(): Promise<HorseRole> {
        return this._horseRoleRepo.getStudentRole();
    }

    @MapClass(HorseRole)
    public async getHorseRoleById(id: ObjectId): Promise<HorseRole> {
        return this._horseRoleRepo.getHorseRoleById(id);
    }

    @MapClass(HorseRole)
    public async getHorseRoles(includeOwner: boolean): Promise<HorseRole[]> {
        return this._horseRoleRepo.getHorseRoles(includeOwner);
    }
}
