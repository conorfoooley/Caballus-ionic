import { ConnectionStatus, RelationshipType } from '../../enums';
import { BaseDoc } from '../base/base-doc';
import { UserIdentityWithoutIds } from '../user/user-identity';
// import { ClickEventWithoutIds } from './click-event';

export class ConnectionWithoutIds extends BaseDoc {
    public _id: any;
    public userIdentities: UserIdentityWithoutIds[] = [];
    public connectionStatus: ConnectionStatus;
    // public clickHistory: ClickEventWithoutIds[] = [];

    // Note: Tracking of relationship type for v1 was removed as there are no rules to determine it
    // Still save it as it may be reintroduced v2
    public initiatedUserRelationshipTypes: RelationshipType[] = [];
    public targetUserRelationshipTypes: RelationshipType[] = [];
    public seenBy: UserIdentityWithoutIds[] = [];

    constructor(params?: Partial<ConnectionWithoutIds>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
            this.userIdentities = Array.isArray(params.userIdentities)
                ? params.userIdentities.map(u => new UserIdentityWithoutIds(u))
                : this.userIdentities;
            this.connectionStatus = params.connectionStatus || this.connectionStatus;
            /* this.clickHistory = Array.isArray(params.clickHistory)
                ? params.clickHistory.map(e => new ClickEventWithoutIds(e))
                : this.clickHistory; */
            this.initiatedUserRelationshipTypes =
                params.initiatedUserRelationshipTypes || this.initiatedUserRelationshipTypes;
            this.targetUserRelationshipTypes =
                params.targetUserRelationshipTypes || this.targetUserRelationshipTypes;
            this.seenBy = Array.isArray(params.seenBy)
                ? params.seenBy.map(u => new UserIdentityWithoutIds(u))
                : this.seenBy;
        }
    }
}
