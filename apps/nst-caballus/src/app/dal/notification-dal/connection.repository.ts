import { /* ClickType,  */ Connection, ConnectionStatus } from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import { MapClass } from '@rfx/nst-common';
import { FindParams, MongoCollectionName, MongoRepository, ObjectId } from '@rfx/nst-db/mongo';

@MongoCollectionName('connection')
@Injectable()
export class ConnectionRepository extends MongoRepository {
    public async createConnection(connection: Connection): Promise<ObjectId> {
        return await this.create({ ...connection });
    }

    public async updateConnection(id: ObjectId, connection: Partial<Connection>): Promise<void> {
        await this.updateById(id, connection);
    }
/* 
    public async getClickCountByUser(userId: ObjectId): Promise<number> {
        const params = new FindParams({
            query: {
                clickHistory: {
                    $elemMatch: {
                        initiatedByUser: userId,
                        clickType: ClickType.Click
                    }
                }
            }
        });
        params.getCount = true;
        const connections = await this.find<Connection>(params);
        if (!connections) {
            return null;
        }

        return connections[1];
    } */

    public async removeDeactivatedUserFromConnections(userId: ObjectId): Promise<void> {
        const params = new FindParams({
            query: {
                userIdentities: {
                    $elemMatch: {
                        _id: userId
                    }
                }
            }
        });
        const connections = await this.find<Connection>(params);

        const ids: ObjectId[] = connections[0].map(a => a._id);

        await this.deactivateConnections(ids);
    }

    public async deactivateConnections(ids: ObjectId[]): Promise<void> {
        await this.updateByIdList(ids, { connectionStatus: ConnectionStatus.Deactivated });
    }

    @MapClass(Connection)
    public async findConnectionByUserIds(userIds: ObjectId[]): Promise<Connection> {
        const findParams = new FindParams({
            query: {
                'userIdentities._id': { $all: [...userIds] }
            }
        });
        return await this.findOne<Connection>(findParams);
    }

    @MapClass(Connection)
    public async listAllConnections(userId: ObjectId): Promise<Connection[]> {
        const findParams = new FindParams({
            query: {
                'userIdentities._id': { $all: [userId] }
            }
        });
        return (await this.find<Connection>(findParams))[0];
    }
}
