import {
    ConnectionIdentity,
    connectionIdentityFromUser,
    Notification,
    NotificationCategory,
    NotificationFrequency,
    NotificationGridParams,
    NotificationSummary,
    NotificationType,
    // Post,
    // PostType,
    // PushNotificationsService,
    // ReadStatus,
    // uniqueListById,
    User,
    // ConnectionMessageState,
    ConnectionStatus
} from '@caballus/api-common';
import { Injectable} from '@nestjs/common';
import { PaginatedList } from '@rfx/common';
import { ObjectId } from '@rfx/njs-db/mongo';
import { isNil, sortBy, last } from 'lodash';
import { UserService } from '../user-dal/user.service';
import { NotificationRepository } from './notification.repository';
import { ConnectionRepository } from './connection.repository';
import { RoomRepository, Room, MessageRepository, Message, MessageReadStat } from '@rfx/nst-chat';

const DISPLAY_NAMES_AFTER_MAX: number = 2;
const NOTIFY_ON_OR_AFTER = 8; // 8AM
const DAY_HOURS = 24;
const DEFAULT_TIMEZONE = 'America/Denver';
@Injectable()
export class NotificationService {
    constructor(
        private readonly _userService: UserService,
        // private readonly _pushNotificationService: PushNotificationsService,
        // private readonly _mailerService: MailerService,
        private readonly _notificationRepository: NotificationRepository,
        private readonly _connectionRepo: ConnectionRepository,
        private readonly _messageRepo: MessageRepository,
        private readonly _roomRepo: RoomRepository
    ) {}

    private _parseDisplayNames(identities: ConnectionIdentity[]): string {
        const displayNames = identities ? identities.map(i => i.displayName || 'anonymous') : [];
        /**
         * Might be better to do it programatically by but users could use comma or the
         * name 'andrew' so something `like join(', ').replace(', a', ' a')`might not
         * produce the expected result between since we have the array length, should be
         * safe to use array index to access displayNames value...
         */
        // tslint:disable: no-magic-numbers
        if (displayNames.length === 0) {
            return 'Someone';
        } else if (displayNames.length === 1) {
            return `${displayNames[0]}`;
        } else if (displayNames.length === 2) {
            return `${displayNames[0]} and ${displayNames[1]}`;
        } else if (displayNames.length === 3) {
            return `${displayNames[0]}, ${displayNames[1]} and ${displayNames[2]}`;
        }
        return `${displayNames[0]}, ${displayNames[1]} and ${displayNames.length -
            DISPLAY_NAMES_AFTER_MAX} other people`;
        // tslint:enable: no-magic-numbers
    }
    private async _createNotification(notification: Notification): Promise<void> {
        const user: User = await this._userService.getUserById(notification.userIdentity._id);
        // if (!user.notificationSettings.receiveNotification[notification.notificationType]) {
        //     return;
        // }
        const notificationId: ObjectId = await this._notificationRepository.createNotification({
            ...notification,
            lastReactionDate: new Date()
        });
        // await this.notifyUser(notificationId);
    }

    public async createNotification(notification: Notification): Promise<void> {
        const user: User = await this._userService.getUserById(notification.userIdentity._id);
        // if (!user.notificationSettings.receiveNotification[notification.notificationType]) {
        //     return;
        // }
        notification.userIdentity =connectionIdentityFromUser(user);
        const notificationId: ObjectId = await this._notificationRepository.createNotification({
            ...notification,
            lastReactionDate: new Date()
        });
        // await this.notifyUser(notificationId);
    }
    /*     private async _updateNotification(notification: Notification): Promise<void> {
        await this._notificationRepository.editNotification(notification._id, {
            ...notification,
            lastReactionDate: new Date()
        });
        await this.notifyUser(notification._id);
    } */
    /* 
    public async notifyUser(notificationId: ObjectId): Promise<void> {
        const notification: Notification = await this.findNotificationById(notificationId);
        if (notification) {
            const user: User = await this._userService.getUserById(notification.userIdentity._id);
            const pushed: boolean = await this._pushNotificationService.pushUser(
                notification,
                user
            );
            if (pushed) {
                await this._notificationRepository.markNotificationAsPushed(notificationId);
            }
            if (
                user.notificationSettings.emailNotification.on &&
                user.notificationSettings.emailNotification.frequency ===
                    NotificationFrequency.Immediate
            ) {
                const mail = new WallNotificationEmailTemplate(notification);
                mail.addTo(
                    user.profile.email,
                    user.profile.firstName
                        ? user.profile.firstName + ' ' + user.profile.lastName
                        : user.displayName
                );
                try {
                    await this._mailerService.send(mail);
                    // Prevents notifications to be included in cron when a user changes notification interval to > immediate
                    await this._notificationRepository.markNotificationAsSent(notificationId);
                } catch (e) {
                    console.error(e);
                    throw new InternalServerErrorException();
                }
            } else if (user.notificationSettings.emailNotification.on === false) {
                // Prevents notifications to be included in cron when a user toggles on the email notifications
                await this._notificationRepository.markNotificationAsSent(notificationId);
            }
        }
    } */
    /* 
    public async bulkNotifyUser(userId: ObjectId, startDate: Date, endDate: Date): Promise<void> {
        const user: User = await this._userService.getUserById(userId);
        let notifications: Notification[] = [];
        if (user) {
            notifications = await this._notificationRepository.findPendingNotificationsByUserId(
                user._id,
                startDate,
                endDate
            );
            // Filter activated notifications
            notifications = notifications.filter(
                notification =>
                    user.notificationSettings.receiveNotification[notification.notificationType]
            );
        }
        if (notifications.length > 0) {
            if (
                user.notificationSettings.emailNotification.on &&
                user.notificationSettings.emailNotification.frequency !==
                    NotificationFrequency.Immediate
            ) {
                const mail = new BulkNotificationsEmailTemplate(
                    notifications,
                    user.notificationSettings.emailNotification.frequency
                );
                mail.addTo(
                    user.profile.email,
                    user.profile.firstName
                        ? user.profile.firstName + ' ' + user.profile.lastName
                        : user.displayName
                );
                try {
                    await this._mailerService.send(mail);
                    await this._notificationRepository.markNotificationIdListAsSent([
                        ...notifications.map(n => n._id)
                    ]);
                } catch (e) {
                    console.error(e);
                    throw new InternalServerErrorException();
                }
            }
        }
    } */

    public findNotificationById(notificationId: ObjectId): Promise<Notification> {
        return this._notificationRepository.findNotificationById(notificationId);
    }

    public findNotificationsByUserId(
        userId: ObjectId,
        gridParams: NotificationGridParams
    ): Promise<PaginatedList<Notification>> {
        return this._notificationRepository.findNotificationsByUserId(userId, gridParams);
    }

    public markNotificationAsRead(notificationId: ObjectId, userId: ObjectId): Promise<void> {
        return this._notificationRepository.markNotificationAsRead(notificationId, userId);
    }

    public markUserNotificationsAsRead(userId: ObjectId): Promise<void> {
        return this._notificationRepository.markUserNotificationsAsRead(userId);
    }

    public removeAllUserNotifications(userId: ObjectId): Promise<void> {
        return this._notificationRepository.removeAllUserNotifications(userId);
    }

    /**
     * Gets user notification summary grouped by category
     *
     * @param userId
     * @returns Notification summary or null if user doesn't exists
     */
    public async getNotificationSummary(userId: ObjectId): Promise<NotificationSummary> {
        const user: User | null = await this._userService.getUserById(userId);
        if (isNil(user)) {
            return null;
        }
        const summary = await this._notificationRepository.getNotificationSummaryByUser(user);

        const connections = await this._connectionRepo.listAllConnections(user._id);
        for (const c of connections) {
            if (!c || c.connectionStatus !== ConnectionStatus.Connected) {
                continue;
            }

            const room: Room = await this._roomRepo.getRoomById(c._id);
            if (!room) {
                continue;
            }
            const roomMessages: Message[] = sortBy(
                await this._messageRepo.getMessagesByRoomId(room._id),
                'createdDate'
            );

            const lastMessage: Message = last(roomMessages);
            const received: boolean =
                lastMessage && lastMessage.sender && !lastMessage.sender._id.equals(user._id);
            const userReadStat: MessageReadStat =
                lastMessage &&
                lastMessage.readStats &&
                lastMessage.readStats.find(r => r.participantId.equals(userId));
            const unread: boolean = received && !userReadStat;
            if (unread) {
                summary['Connections'] += 1;
            }
        }

        return summary;
    }

    public async createUserDisplayNameChangeNotification(
        previousUserState: User,
        updatedUserState: User
    ): Promise<void> {
        // const { displayName: previousDisplayName }: User = previousUserState;
        // const { displayName: updatedDisplayName }: User = updatedUserState;
        // // This was never tested before...
        // const notification = new Notification({
        //     userIdentity: connectionIdentityFromUser(updatedUserState),
        //     notificationCategory: NotificationCategory.Profile,
        //     notificationType: NotificationType.DisplayNameChanged,
        //     message: `Your display name was changed from ${previousDisplayName} to ${updatedDisplayName}`
        // });
        // await this._createNotification(notification);
    }

    public removeAllNotifications(userId: ObjectId){

    }

    /*   public async createConnectionRequestNotification(
        targetUserIdentity: ConnectionIdentity,
        initiatedByUserIdentity: ConnectionIdentity
    ): Promise<void> {
        const notification = new Notification({
            notificationCategory: NotificationCategory.Click,
            notificationType: NotificationType.NewConnectionRequest,
            message: `${initiatedByUserIdentity.displayName} sent you a connection request`,
            userIdentity: targetUserIdentity,
            connectedUserIdentity: initiatedByUserIdentity
        });

        await this._createNotification(notification);
    } */

    /*     public async createConnectionAcceptedNotification(
        targetUserIdentity: ConnectionIdentity,
        initiatedByUserIdentity: ConnectionIdentity
    ): Promise<void> {
        const notification = new Notification({
            notificationCategory: NotificationCategory.Connections,
            notificationType: NotificationType.NewConnectionAccepted,
            message: `${initiatedByUserIdentity.displayName} accepted your connection request`,
            userIdentity: targetUserIdentity,
            connectedUserIdentity: initiatedByUserIdentity
        });

        await this._createNotification(notification);
    } */

    /*  public async createConnectionMadeNotification(
        initiatedByUserIdentity: ConnectionIdentity,
        targetUserIdentity: ConnectionIdentity
    ): Promise<void> {
        const notification: Notification = new Notification({
            notificationCategory: NotificationCategory.Connections,
            notificationType: NotificationType.NewConnectionMade,
            message: `You connected with ${targetUserIdentity.displayName}`,
            userIdentity: initiatedByUserIdentity,
            connectedUserIdentity: targetUserIdentity
        });

        await this._createNotification(notification);
    } */
    /* 
    public async createWallPostCommentNotification(
        post: Post,
        rootPost: Post,
        targetUserIdentity: ConnectionIdentity
    ): Promise<void> {
        let notification: Notification | null = await this._notificationRepository.findNotificationByRootPost(
            rootPost._id,
            NotificationType.WallPostComment
        );
        const shouldCreateNotification = notification === null;
        const reactingUserIdentities = uniqueListById([
            post.userIdentity,
            ...(notification ? notification.reactingUserIdentities : [])
        ]);
        notification = new Notification({
            ...(notification || {}),
            ...{
                notificationCategory: NotificationCategory.Wall,
                notificationType: NotificationType.WallPostComment,
                readStatus: ReadStatus.Unread,
                message: `${this._parseDisplayNames(
                    reactingUserIdentities
                )} commented on your post "${computePostText(rootPost)}"`,
                userIdentity: targetUserIdentity,
                connectedPostId: post._id,
                connectedRootPostId: rootPost._id
            },
            reactingUserIdentities
        });

        if (shouldCreateNotification) {
            await this._createNotification(notification);
        } else {
            delete notification.modifiedDate;
            await this._updateNotification(notification);
        }
    }

    public async createTaggedInWallPostNotification(
        post: Post,
        targetUserIdentity: ConnectionIdentity,
        rootPost: Post
    ): Promise<void> {
        let targetPost: Post = post;
        let postType: 'post' | 'comment' = 'post';
        if (post.type === PostType.Comment) {
            postType = 'comment';
        } else {
            targetPost = rootPost || post;
        }
        const notification: Notification = new Notification({
            notificationCategory: NotificationCategory.Wall,
            notificationType: NotificationType.WallPostTagged,
            message: `${
                post.userIdentity.displayName
            } tagged you in a ${postType} "${computePostText(targetPost)}"`,
            userIdentity: targetUserIdentity,
            connectedPostId: post._id,
            connectedRootPostId: rootPost._id
        });

        await this._createNotification(notification);
    }

    public async createWallPostLikeNotification(postLike: Post, targetPost: Post): Promise<void> {
        // Find notification by subject, should be always a comment or wall post
        let notification: Notification | null = await this._notificationRepository.findNotificationByPost(
            targetPost._id,
            NotificationType.WallPostLiked
        );
        const shouldCreateNotification = notification === null;
        const reactingUserIdentities = uniqueListById([
            postLike.userIdentity,
            ...(notification ? notification.reactingUserIdentities : [])
        ]);
        notification = new Notification({
            ...(notification || {}),
            ...{
                notificationCategory: NotificationCategory.Wall,
                notificationType: NotificationType.WallPostLiked,
                readStatus: ReadStatus.Unread,
                message: `${this._parseDisplayNames(reactingUserIdentities)} reacted to your ${
                    targetPost.type === PostType.Comment ? 'comment' : 'post'
                } "${computePostText(targetPost)}"`,
                userIdentity: targetPost.userIdentity,
                connectedPostId: targetPost._id, // Subject
                connectedRootPostId: targetPost.ancestorPostIds[0] || targetPost._id // Comment ancestor (WallPost) || WallPost
            },
            reactingUserIdentities
        });

        if (shouldCreateNotification) {
            await this._createNotification(notification);
        } else {
            delete notification.modifiedDate;
            await this._updateNotification(notification);
        }
    } */
    /* 
    public async bulkNotifications(): Promise<void> {
        const currentDate: moment.Moment = moment();
        const dayOfTheMonth: number = currentDate.date(); // For Monthy Notifications
        const dayOfTheWeek: number = currentDate.day(); // For Weekly Notifications
        const pendingDailyUsers: User[] = await this._userService.findUsersToBulkNotificationsAfterDate(
            currentDate.toDate(),
            NotificationFrequency.Daily
        );
        const pendingWeeklyUsers: User[] =
            dayOfTheWeek === 1
                ? await this._userService.findUsersToBulkNotificationsAfterDate(
                      currentDate.toDate(),
                      NotificationFrequency.Weekly
                  )
                : [];
        const pendingMonthlyUsers: User[] =
            dayOfTheMonth === 1
                ? await this._userService.findUsersToBulkNotificationsAfterDate(
                      currentDate.toDate(),
                      NotificationFrequency.Monthly
                  )
                : [];
        const notificationUsers: User[] = [
            ...pendingDailyUsers.filter(
                user =>
                    currentDate.diff(
                        // In case last push was delayed, so notification can be pushed at the same time next day
                        // tslint:disable-next-line: no-magic-numbers
                        moment(user.lastBulkNotification).subtract(1, 'hour'),
                        'hours'
                    ) >= DAY_HOURS
            ),
            ...pendingWeeklyUsers,
            ...pendingMonthlyUsers
        ];
        const jobs = notificationUsers.map(async user => {
            try {
                const userCurrentDate = currentDate.tz(user.profile.timezone || DEFAULT_TIMEZONE);
                if (userCurrentDate.hour() >= NOTIFY_ON_OR_AFTER) {
                    await this.bulkNotifyUser(
                        user._id,
                        user.lastBulkNotification,
                        userCurrentDate.toDate()
                    );
                    await this._userService.updateLastBulkNotification(user._id);
                }
            } catch (error) {
                // Retry on next batch
            }
        });
        await Promise.all(jobs);
    } */
}
