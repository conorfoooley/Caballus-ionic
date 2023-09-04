import { BaseDoc } from '../base/base-doc';

export class ConnectionCacheWithoutIds extends BaseDoc {
    public _id: any;
    public userId: any;
    public newConnectionIds: any[] = [];
    public connectionIds: any[] = [];
    public potentialConnectionIds: any[] = [];
    public preferredConnectionIds: any[] = [];
    public blockedIds: any[] = [];
    public connectionRequestIds: any[] = [];

    /**
        ConnectionIds are ids of other users the main user is already connected with
        PotentialConnectionIds are ids of users the main user could potentially connect with
            (as determined solely by their shared Connection.clickHistory)
        PreferredConnectionIds is further filtering of PotentialConnectionIds, based on what the main user is looking for
            (as determined by both user's profileDetails/rfxFormResponses)
    */

    constructor(params?: Partial<ConnectionCacheWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.userId = params.userId || this.userId;
            this.newConnectionIds = Array.isArray(params.newConnectionIds)
                ? params.newConnectionIds
                : this.newConnectionIds;
            this.connectionIds = Array.isArray(params.connectionIds)
                ? params.connectionIds
                : this.connectionIds;
            this.potentialConnectionIds = Array.isArray(params.potentialConnectionIds)
                ? params.potentialConnectionIds
                : this.potentialConnectionIds;
            this.preferredConnectionIds = Array.isArray(params.preferredConnectionIds)
                ? params.preferredConnectionIds
                : this.preferredConnectionIds;
            this.blockedIds = Array.isArray(params.blockedIds)
                ? params.blockedIds
                : this.blockedIds;
            this.connectionRequestIds = Array.isArray(params.connectionRequestIds)
                ? params.connectionRequestIds
                : this.connectionRequestIds;
        }
    }
}
