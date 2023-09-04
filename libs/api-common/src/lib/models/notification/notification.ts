import { NotificationWithoutIds } from '@caballus/common';
import { ObjectId, parseObjectId } from '@rfx/njs-db/mongo';
import { ConnectionIdentity } from '../connection/connection-identity';

export class Notification extends NotificationWithoutIds {
    public _id: ObjectId;
    public userIdentity: ConnectionIdentity = null;
    public connectedUserIdentity: ConnectionIdentity = null;
    public connectedPostId: ObjectId = null;
    public connectedRootPostId: ObjectId = null;
    public reactingUserIdentities: ConnectionIdentity[] = [];
    public rideId: ObjectId = null;
    constructor(params: Partial<Notification>) {
        super(params);
        if (!!params) {
            this._id = !!params._id ? parseObjectId(params._id) : this._id;
            this.userIdentity = !!params.userIdentity
                ? new ConnectionIdentity(params.userIdentity)
                : this.userIdentity;
            this.connectedUserIdentity = !!params.connectedUserIdentity
                ? new ConnectionIdentity(params.connectedUserIdentity)
                : this.connectedUserIdentity;
            this.connectedPostId = !!params.connectedPostId
                ? parseObjectId(params.connectedPostId)
                : this.connectedPostId;
            this.rideId = !!params.rideId
                ? parseObjectId(params.rideId)
                : this.rideId;
            this.connectedRootPostId = !!params.connectedRootPostId
                ? parseObjectId(params.connectedRootPostId)
                : this.connectedRootPostId;
            this.reactingUserIdentities =
                !!params.reactingUserIdentities && Array.isArray(params.reactingUserIdentities)
                    ? [...params.reactingUserIdentities.map(r => new ConnectionIdentity(r))]
                    : this.reactingUserIdentities;
        }
    }
}
