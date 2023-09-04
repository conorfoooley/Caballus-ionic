import { ConnectionIdentity, Friend, FriendStatus, Notification, User, UserIdentity } from "@caballus/api-common";
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { ObjectId } from "@rfx/njs-db/mongo";
import { MediaService } from "../media-dal/media.service";
import { FriendRepository } from "./friend.repository";
import { UserRepository } from "./user.repository";
import { NotificationRepository } from "./notification.repository";
import { MailerService } from "@rfx/njs-mailer";
import { FriendRequestResponseEmailTemplate } from "@nst-caballus/library";
import { NotificationCategory, NotificationType, Status } from "@caballus/common";

@Injectable()
export class FriendService {
  constructor(
    private readonly _friendRepo: FriendRepository,
    private readonly _userRepo: UserRepository,
    private readonly _notificationRepo: NotificationRepository,
    private readonly _mediaService: MediaService,
    private readonly _mailerService: MailerService
  ) {
  }

  public async getAllFriends(userId: ObjectId): Promise<Friend[]> {
    const friends = await this._friendRepo.getAllFriends(userId);
    for (const u of friends) {
      if (!!u.friendIdentity.picture && u.friendIdentity.picture.path) {
        u.friendIdentity.picture.url = await this._mediaService.getSignedUrl(
          u.friendIdentity.picture.path
        );
      }

      if (!!u.userIdentity.picture && u.userIdentity.picture.path) {
        u.userIdentity.picture.url = await this._mediaService.getSignedUrl(
          u.userIdentity.picture.path
        );
      }
    }
    return friends;
  }

  public async getFriendById(id: ObjectId, user: User): Promise<Friend> {
    const friend = await this._friendRepo.getFriendById(id);
    if (!friend) {
      throw new BadGatewayException("Invalid friend request.");
    }

    if (!friend.friendIdentity._id.equals(user._id)) {
      throw new BadGatewayException("This request is not for you.");
    }

    if (friend.friendStatus !== FriendStatus.Requested) {
      throw new BadGatewayException("Invalid friend request");
    }

    if (!!friend && !!friend.profilePicture && friend.profilePicture.path) {
      friend.profilePicture.url = await this._mediaService.getSignedUrl(
        friend.profilePicture.path
      );
    }
    return friend;
  }

  public async getFriendsByUserId(userId: ObjectId): Promise<Friend[]> {
    return this._friendRepo.getFriendsByUserId(userId);
  }

  /**
   * changeFriendStatus
   * @param id
   * @param friendStatus
   * @param user
   */
  public async changeFriendStatus(
    id: ObjectId,
    friendStatus: FriendStatus,
    user: User
  ): Promise<void> {
    const friendRequestDetails = await this._friendRepo.getFriendById(id);
    if (!friendRequestDetails) {
      throw new NotFoundException("Friend request details not found");
    }

    // prepare update object
    const update: Partial<Friend> = {
      friendIdentity: friendRequestDetails.friendIdentity,
      userIdentity: friendRequestDetails.userIdentity,
      friendStatus,
      // mark status as InActive when friend request is rejected
      ...(friendStatus === FriendStatus.Rejected && { status: Status.InActive })
    };

    // update friend request
    await this._friendRepo.updateFriend(id, update, user._id);

    const riderUser = await this._userRepo.getUserById(friendRequestDetails.userIdentity._id);
    const friendUser = await this._userRepo.getUserById(
      friendRequestDetails.friendIdentity._id
    );

    let message = "";
    let notificationType: NotificationType;
    let notification: Notification = new Notification({
      message,
      userIdentity: new ConnectionIdentity({
        ...riderUser.profile,
        displayName: `${riderUser.profile.firstName} ${riderUser.profile.lastName}`,
        profilePicture: riderUser.profile.profilePicture,
        profileUrl: riderUser.profileUrl,
        profilePublic: riderUser.profilePublic
      }),
      notificationCategory: NotificationCategory.Rider,
      notificationType: NotificationType.FriendAccept,
      riderIdentity: new ConnectionIdentity({
        ...user.profile,
        displayName: `${user.profile.firstName} ${user.profile.lastName}`,
        profilePicture: user.profile.profilePicture,
        profileUrl: user.profileUrl,
        profilePublic: user.profilePublic
      }),
      lastReactionDate: new Date(),
      friendId: id
    });
    switch (friendStatus) {
      case FriendStatus.Friends:
        message = "accepted your friend invitation";
        notificationType = NotificationType.FriendAccept;
        break;
      case FriendStatus.Rejected:
        message = "declined your friend invitation";
        notificationType = NotificationType.FriendReject;

        break;
      case FriendStatus.Blocked:
        message = "blocked your friend invitation";
        notificationType = NotificationType.FriendBlock;
        notification.userIdentity = new ConnectionIdentity({
          ...friendUser.profile,
          displayName: `${friendUser.profile.firstName} ${friendUser.profile.lastName}`,
          profilePicture: friendUser.profile.profilePicture,
          profileUrl: friendUser.profileUrl,
          profilePublic: friendUser.profilePublic
        });
        notification.riderIdentity = new ConnectionIdentity({
          ...user.profile,
          displayName: `${user.profile.firstName} ${user.profile.lastName}`,
          profilePicture: user.profile.profilePicture,
          profileUrl: user.profileUrl,
          profilePublic: user.profilePublic
        });
        break;
    }
    notification.message = message;
    notification.notificationType = notificationType;
    this._notificationRepo.createNotification(notification);
    // // send response email
    await this._sendFriendRequestResponseEmail(
      friendRequestDetails.userIdentity,
      friendRequestDetails.friendIdentity,
      friendStatus
    );
  }

  public async blockFriend(id: ObjectId, activeUser: User): Promise<ObjectId> {
    const existingFriend = await this._friendRepo.getFriendById(id);
    if (existingFriend) {
      this.changeFriendStatus(existingFriend._id, FriendStatus.Blocked, activeUser);
      return;
    }
  }

  public async unblockFriend(id: ObjectId, activeUser: User): Promise<ObjectId> {
    const existingFriend = await this._friendRepo.getFriendById(id);
    if (existingFriend) {
      // this.changeFriendStatus(existingFriend._id, FriendStatus.Requested, activeUser);
      this.removeFriend(id);
      return;
    }
  }

  public async createFriend(addedUserId: ObjectId, activeUser: User): Promise<ObjectId> {
    const friendRequestDetails = await this._friendRepo.getFriendShipDetails(
      activeUser._id,
      addedUserId
    );

    if (!!friendRequestDetails && friendRequestDetails.friendStatus === FriendStatus.Friends) {
      throw new BadRequestException("User Already a Friend");
    } else if (!!friendRequestDetails && friendRequestDetails.friendStatus === FriendStatus.Requested) {
      throw new BadRequestException(
        activeUser._id.toString() == friendRequestDetails.userIdentity._id.toString() ? "Already sent friend request" : `${friendRequestDetails.userIdentity.label} already sent friend request to you. Please accept.`);
    }

    const addedUser = await this._userRepo.getUserById(addedUserId);
    const friend: Partial<Friend> = {
      friendIdentity: new UserIdentity({
        ...addedUser.profile,
        label: `${addedUser.profile.firstName} ${addedUser.profile.lastName}`,
        email: addedUser.profile.email,
        picture: addedUser.profile.profilePicture
      }),
      userIdentity: new UserIdentity({
        ...activeUser.profile,
        label: `${activeUser.profile.firstName} ${activeUser.profile.lastName}`,
        email: activeUser.profile.email,
        picture: activeUser.profile.profilePicture
      }),
      firstName: addedUser.profile.firstName,
      lastName: addedUser.profile.lastName,
      userName: addedUser.profile.url,
      profilePicture: addedUser.profile.profilePicture,
      friendStatus: FriendStatus.Requested
    };

    return this._friendRepo.createFriend(friend).then(friendId => {
      const createNotification = new Notification({
        message: "sent you an invitation to be a friend.",
        userIdentity: new ConnectionIdentity({
          ...addedUser.profile,
          displayName: `${addedUser.profile.firstName} ${addedUser.profile.lastName}`,
          profilePicture: addedUser.profile.profilePicture,
          profileUrl: addedUser.profileUrl,
          profilePublic: addedUser.profilePublic
        }),
        notificationCategory: NotificationCategory.Rider,
        notificationType: NotificationType.FriendInvite,
        friendIdentity: new ConnectionIdentity({
          ...activeUser.profile,
          displayName: `${activeUser.profile.firstName} ${activeUser.profile.lastName}`,
          profilePicture: activeUser.profile.profilePicture,
          profileUrl: activeUser.profileUrl,
          profilePublic: activeUser.profilePublic
        }),
        lastReactionDate: new Date(),
        friendId: friendId
      });
      this._notificationRepo.createNotification(createNotification);
      return friendId;
    });
  }

  public async removeFriend(id: ObjectId): Promise<void> {
    return this._friendRepo.removeFriend(id);
  }

  public async removeAllFriend(): Promise<void> {
    return this._friendRepo.removeAllFriend();
  }

  private async _sendFriendRequestResponseEmail(
    requester: UserIdentity,
    requestee: UserIdentity,
    response: FriendStatus
  ): Promise<void> {
    const mail = new FriendRequestResponseEmailTemplate(requester, requestee, response);
    mail.addTo(requester.email);
    try {
      await this._mailerService.send(mail);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
