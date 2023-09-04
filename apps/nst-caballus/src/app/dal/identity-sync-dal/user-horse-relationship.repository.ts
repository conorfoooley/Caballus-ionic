import { HorseIdentity, UserIdentity } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    MongoCollectionName,
    UpdateParams
} from '@rfx/nst-db/mongo';

@MongoCollectionName('userHorseRelationship')
@Injectable()
export class UserHorseRelationshipRepository extends MongoRepository {

    public async updateUserIdentities(userIdentity: UserIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'userIdentity._id' : userIdentity._id
        };

        const update = {
            userIdentity : userIdentity
        };

        this.update(update, updateParams);

        const updateParams2 = new UpdateParams();
        updateParams2.updateMultiple = true;
        updateParams2.query = {
            'latest.userIdentity._id' : userIdentity._id
        };

        const update2 = {
            'latest.userIdentity' : userIdentity
        };

        this.update(update2, updateParams2);

        const updateParams3 = new UpdateParams();
        updateParams3.updateMultiple = true;
        updateParams3.query = {
            'history.userIdentity._id' : userIdentity._id
        };

        const update3 = {
            $set: { 'history.$.userIdentity' : userIdentity }
        };

        this.updateBase(update3, updateParams3);
    }

    public async updateHorseIdentities(horseIdentity: HorseIdentity): Promise<void> {
        const updateParams = new UpdateParams();
        updateParams.updateMultiple = true;
        updateParams.query = {
            'horseIdentity._id' : horseIdentity._id
        };

        const update = {
            horseIdentity : horseIdentity
        };

        this.update(update, updateParams);
    }
}
