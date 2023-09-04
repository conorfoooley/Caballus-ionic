import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    FindParams,
    ObjectId,
    stringLike,
    MongoCollectionName,
    UpdateParams,
    numberMatch,
    boolMatch,
    emptyCondition,
    match
} from '@rfx/nst-db/mongo';
import { SortDirection, Status } from '@rfx/common';
import {
    BaseMediaDocument,
    Horse,
    HorseDetails,
    HorseForRide,
    HorseProfileStatus,
    HorseVeterinarianProfile,
    HorseProfilePrivacy
} from '@caballus/api-common';
import { pipe } from 'rxjs';
import { GridParams, PaginatedList } from '@rfx/common';
import { MapClass } from '@rfx/nst-common';
import { emptyStage, lookup, project, sort, unwind } from '@rfx/njs-db/mongo';

@MongoCollectionName('horse')
@Injectable()
export class HorseRepository extends MongoRepository {
    public async updateHorsesProfileStatusByIdList(
        ids: ObjectId[],
        profileStatus: HorseProfileStatus
    ): Promise<void> {
        const params = new UpdateParams();
        params.updateMultiple = true;
        params.query = pipe(numberMatch('status', Status.Active))([]);
        await this.updateByIdList(ids, {'profile.profileStatus': profileStatus}, params);
    }
}
