import { HorseIdentity, UserIdentity } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    MongoCollectionName,
    UpdateParams
} from '@rfx/nst-db/mongo';

@MongoCollectionName('ride')
@Injectable()
export class RideRepository extends MongoRepository {

    public async updateUserIdentities(userIdentity: UserIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'riderIdentity._id' : userIdentity._id
        };

        const update = {
            riderIdentity : userIdentity
        };

        this.update(update, updateParams);
    }

    public async updateHorseIdentities(horseIdentity: HorseIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'horseIdentities._id' : horseIdentity._id
        };

        const update = {
            $set: { 'horseIdentities.$' : horseIdentity }
        };

        this.updateBase(update, updateParams);
    }
}
