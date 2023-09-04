import { ObjectId } from "bson";
import { NotificationCategory, NotificationType, ReadStatus } from "../../enums";
import { BaseDoc } from "../base/base-doc";
import { ConnectionIdentityWithoutIds } from "../connection/connection-identity";
import { HorseIdentityWithoutIds } from "../horse/horse-identity";

export class NotificationWithoutIds extends BaseDoc {
  public _id: any;
  public userIdentity: ConnectionIdentityWithoutIds = null;
  public notificationCategory: NotificationCategory;
  public notificationType: NotificationType;
  public readStatus: ReadStatus = ReadStatus.Unread;
  public message: string = "";
  public sendDate: Date = null;
  public pushDate: Date = null;
  public lastReactionDate: Date = null;
  public connectedUserIdentity: ConnectionIdentityWithoutIds = null;
  public connectedPostId: any = null;
  public connectedRootPostId: any = null;
  public reactingUserIdentities: ConnectionIdentityWithoutIds[] = [];
  public riderIdentity: ConnectionIdentityWithoutIds = null;
  public friendIdentity: ConnectionIdentityWithoutIds = null;
  public horseIdentity: HorseIdentityWithoutIds = null;
  public friendId: any = null;
  public rideId: ObjectId = null

  constructor(params?: Partial<NotificationWithoutIds>) {
    super(params);
    if (!!params) {
      this._id = params._id || this._id;
      this.userIdentity = !!params.userIdentity
        ? new ConnectionIdentityWithoutIds(params.userIdentity)
        : this.userIdentity;
      this.notificationCategory = params.notificationCategory || this.notificationCategory;
      this.notificationType = params.notificationType || this.notificationType;
      this.readStatus = params.readStatus || this.readStatus;
      this.message = params.message || this.message;
      this.sendDate = params.sendDate ? new Date(params.sendDate) : this.sendDate;
      this.pushDate = params.pushDate ? new Date(params.pushDate) : this.pushDate;
      this.lastReactionDate = params.lastReactionDate
        ? new Date(params.lastReactionDate)
        : this.lastReactionDate;
      this.riderIdentity = !!params.riderIdentity
        ? new ConnectionIdentityWithoutIds(params.riderIdentity)
        : this.riderIdentity;
      this.friendIdentity = !!params.friendIdentity
        ? new ConnectionIdentityWithoutIds(params.friendIdentity)
        : this.friendIdentity;
      this.horseIdentity = !!params.horseIdentity
        ? new HorseIdentityWithoutIds(params.horseIdentity)
        : this.horseIdentity;
      this.friendId = !!params.friendId ? params.friendId : this.friendId;
      this.rideId = !!params.rideId
      ? params.rideId
      : this.rideId;
      this.connectedUserIdentity = !!params.connectedUserIdentity
        ? new ConnectionIdentityWithoutIds(params.connectedUserIdentity)
        : this.connectedUserIdentity;
      this.connectedPostId = !!params.connectedPostId
        ? params.connectedPostId
        : this.connectedPostId;
      this.connectedRootPostId = !!params.connectedRootPostId
        ? params.connectedRootPostId
        : this.connectedRootPostId;
      this.reactingUserIdentities =
        !!params.reactingUserIdentities && Array.isArray(params.reactingUserIdentities)
          ? [
            ...params.reactingUserIdentities.map(
              r => new ConnectionIdentityWithoutIds(r)
            )
          ]
          : this.reactingUserIdentities;
    }
  }
}
