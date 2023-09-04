import { Injectable } from '@nestjs/common';
import {
    MongoRepository,
    MongoCollectionName,
    ObjectId,
    UpdateParams,
    FindParams,
    objectIdMatch,
    stringEqual
} from '@rfx/nst-db/mongo';
import { pipe } from 'rxjs';
import {
    Invitation,
    InvitationStatus,
    InvitationType
} from '@caballus/api-common';
import { MapClass } from '@rfx/nst-common';
import { Status } from '@rfx/common';

@MongoCollectionName('invitation')
@Injectable()
export class InvitationRepository extends MongoRepository {

    @MapClass(Invitation)
    public async getInvitationById(id: ObjectId): Promise<Invitation> {
        return this.findOneById<Invitation>(id, new FindParams());
    }

    public async createInvitation(invitation: Partial<Invitation>): Promise<ObjectId> {
        return this.create(invitation);
    }

    public async updateInvitation(id: ObjectId, update: Partial<Invitation>): Promise<void> {
        await this.updateById(id, update);
    }

    @MapClass(Invitation)
    public async getInvitation(
        horseId: ObjectId,
        horseRoleId: ObjectId,
        fromUserId: ObjectId,
        invitationStatus: InvitationStatus,
    ): Promise<Invitation> {
        const params = new FindParams({ query: {
            status: Status.Active,
            'from._id': fromUserId,
            'horseIdentity._id': horseId,
            'horseRoleIdentity._id' : horseRoleId,
            invitationStatus
        }});
        return this.findOne<Invitation>(params);
    }

    @MapClass(Invitation)
    public async getInvitationsFromUser(
        fromUserId: ObjectId,
        horseRoleId: ObjectId = null,
        invitationStatus: InvitationStatus = null
    ): Promise<Invitation[]> {
        const params = new FindParams({ query: {
            status: Status.Active,
            'from._id': fromUserId
        }});
        if (horseRoleId) {
            params.query = pipe(
                objectIdMatch('horseRoleIdentity._id', horseRoleId)
            )(params.query);
        }
        if (invitationStatus) {
            params.query = pipe(
                stringEqual('invitationStatus', invitationStatus)
            )(params.query);
        }
        params.getAllResults(true);
        const result = await this.find<Invitation>(params);
        return result[0];
    }

    public async countInvitations(
        horseId: ObjectId,
        horseRoleId: ObjectId,
        invitationStatus: InvitationStatus,
    ): Promise<number> {
        const params = new FindParams({ query: {
            status: Status.Active,
            'horseIdentity._id': horseId,
            'horseRoleIdentity._id': horseRoleId,
            invitationStatus
        }});
        const collection = await this.getCollection();
        return collection.countDocuments(params.query);
    }

    @MapClass(Invitation)
    public async getInvitationsForUser(
        forUserId: ObjectId,
        horseId: ObjectId = null,
        invitationStatus: InvitationStatus = null
    ): Promise<Invitation[]> {
        const params = new FindParams({ query: {
            status: Status.Active,
            'to.userIdentity._id': forUserId
        }});
        if (horseId) {
            params.query = pipe(
                objectIdMatch('horseIdentity._id', horseId)
            )(params.query);
        }
        if (invitationStatus) {
            params.query = pipe(
                stringEqual('invitationStatus', invitationStatus)
            )(params.query);
        }
        params.getAllResults(true);
        const result = await this.find<Invitation>(params);
        return result[0];
    }

    @MapClass(Invitation)
    public async getInvitationsByHorseId(
        horseId: ObjectId,
        inStatus?: InvitationStatus[],
        includeOwner: boolean = false
    ): Promise<Invitation[]> {
        const params = new FindParams({ query: {
            status: Status.Active,
            'horseIdentity._id': horseId
        }});

        if (!!inStatus) {
            params.query['invitationStatus'] = { $in: inStatus };
        }

        if (!includeOwner) {
            params.query['invitationType'] = InvitationType.General;
        }

        params.getAllResults(true);
        const result = await this.find<Invitation>(params);
        return result[0];
    }
}
