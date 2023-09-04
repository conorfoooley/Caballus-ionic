import {
    Notification,
    NotificationCategory,
    NotificationGridParams,
    NotificationSummary,
    NotificationType,
    ReadStatus,
    User
} from '@caballus/api-common';
import { Injectable } from '@nestjs/common';
import { PaginatedList, SortDirection, Status } from '@rfx/common';
import { DbResult } from '@rfx/njs-db';
import {
    FindParams,
    MongoCollectionName,
    MongoRepository,
    ObjectId,
    UpdateParams
} from '@rfx/nst-db/mongo';
import { isNil } from 'lodash';
export const NOTIFICATION_FETCH_LIMIT: number = 25;

@MongoCollectionName('notification')
@Injectable()
export class NotificationRepository extends MongoRepository {
    /**
     * Gets user notification summary grouped by category
     *
     * @param user
     * @param after Retrieve summary after a specific date
     * @returns NotificationSummary
     */
    public async getNotificationSummaryByUser(user: User): Promise<NotificationSummary> {
        if (isNil(user)) {
            return null;
        }

        const collection = await this.getCollection();
        const notificationSummaryDbResult = await collection
            .aggregate<{ _id: string; count: number }>([
                {
                    $match: {
                        'userIdentity._id': user._id,
                        status: Status.Active,
                        readStatus: ReadStatus.Unread,
                        $or: [
                            {
                                notificationCategory: {
                                    $eq: NotificationCategory.Caballus
                                },
                                notificationType: {
                                    $in: [
                                        NotificationType.NewConnectionMade,
                                        NotificationType.NewMessage,
                                        NotificationType.RequestForActivities
                                    ]
                                }
                            },
                            {
                                notificationCategory: {
                                    $eq: NotificationCategory.Horse
                                },
                                notificationType: {
                                    $in: [
                                        NotificationType.NewConnectionRequest,
                                        NotificationType.NewHobbyOrInterestAdded
                                    ]
                                }
                            },
                            // Will leave this here until implementation is done
                            // {
                            //     notificationCategory: {
                            //         $eq: NotificationCategory.Groups
                            //     },
                            //     notificationType: {
                            //         $in: [
                            //             NotificationType.GroupPostNew,
                            //             NotificationType.GroupPostLiked,
                            //             NotificationType.GroupPostComment,
                            //             NotificationType.GroupPostShared,
                            //             NotificationType.GroupPostTagged,
                            //             NotificationType.GroupInvited
                            //         ]
                            //     }
                            // },
                            {
                                notificationCategory: {
                                    $eq: NotificationCategory.Rider
                                },
                                notificationType: {
                                    $in: [
                                        NotificationType.WallPostComment,
                                        NotificationType.WallPostLiked,
                                        NotificationType.WallPostShared,
                                        NotificationType.WallPostTagged
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$notificationCategory',
                        count: {
                            $sum: 1
                        }
                    }
                }
            ])
            .toArray();

        const notificationSummaryData = {};
        Object.values(notificationSummaryDbResult).forEach(
            notificationCategory =>
                (notificationSummaryData[
                    NotificationCategory.toString(notificationCategory._id as NotificationCategory)
                ] = notificationCategory.count)
        );

        // Notification Count
        notificationSummaryData['Notifications'] = await collection.countDocuments({
            'userIdentity._id': user._id,
            status: Status.Active,
            readStatus: ReadStatus.Unread
        });

        // Collect number of unread threads.

        return new NotificationSummary(notificationSummaryData);
    }

    /**
     * Inserts a new notification into the DB
     *
     * @param notification
     * @returns The id of the newly inserted notification
     */
    public findNotification(): Promise<Notification[] | unknown[]> {
        return this.find(new FindParams()).then(res => {
            return res[0];
        });
    }

    /**
     * Inserts a new notification into the DB
     *
     * @param notification
     * @returns The id of the newly inserted notification
     */
    public createNotification(notification: Notification): Promise<ObjectId> {
        return this.create(notification);
    }

    public async findNotificationById(notificationId: ObjectId): Promise<Notification> {
        const notification = await this.findOneById(notificationId, new FindParams());
        if (!notification) {
            return null;
        }
        return new Notification(notification);
    }

    public async findNotificationByRootPost(
        connectedRootPostId: ObjectId,
        notificationType: NotificationType
    ): Promise<Notification> {
        const notification = await this.findOne(
            new FindParams({
                query: {
                    connectedRootPostId,
                    notificationType
                }
            })
        );
        if (!notification) {
            return null;
        }
        return new Notification(notification);
    }

    public async findNotificationByPost(
        connectedPostId: ObjectId,
        notificationType: NotificationType
    ): Promise<Notification> {
        const notification = await this.findOne(
            new FindParams({
                query: {
                    connectedPostId,
                    notificationType
                }
            })
        );
        if (!notification) {
            return null;
        }
        return new Notification(notification);
    }

    public async findNotificationsByUserId(
        userId: ObjectId,
        gridParams: NotificationGridParams
    ): Promise<PaginatedList<Notification>> {
        const pageLimit: number = gridParams.grid.pagination.limit || NOTIFICATION_FETCH_LIMIT;

        const findParams: FindParams = new FindParams({
            query: {
                'userIdentity._id': userId,
                createdDate: { $lte: gridParams.filters.createdDate.endDate || new Date() }
            },
            sort: [['lastReactionDate', SortDirection.Descending]],
            page: gridParams.grid.pagination.page || 1,
            limit: pageLimit,
            getCount: true
        });
        findParams.getAllResults(true);
        return new PaginatedList<Notification>(await this.find(findParams), Notification);
    }

    public async findPendingNotificationsByUserId(
        userId: ObjectId,
        startDate: Date,
        endDate: Date
    ): Promise<Notification[]> {
        const findParams: FindParams = new FindParams({
            query: {
                'userIdentity._id': userId,
                createdDate: { $gte: startDate, $lte: endDate },
                sendDate: null,
                readStatus: ReadStatus.Unread,
                status: Status.Active
            },
            sort: [['lastReactionDate', SortDirection.Descending]]
        });
        findParams.getAllResults(true);
        const [notifications]: DbResult<Notification> = await this.find<Notification>(findParams);
        return notifications.map(n => new Notification(n));
    }

    public async editNotification(
        id: ObjectId,
        notification: Partial<Notification>
    ): Promise<void> {
        await this.updateById(id, notification);
    }

    public async markNotificationAsSent(notificationId: ObjectId): Promise<void> {
        const updateParams: UpdateParams = new UpdateParams();
        updateParams.query = {
            sendDate: null
        };
        await this.updateById(
            notificationId,
            {
                sendDate: new Date()
            },
            updateParams
        );
    }

    public async markNotificationIdListAsSent(notificationIds: ObjectId[]): Promise<void> {
        const updateParams: UpdateParams = new UpdateParams(true);
        updateParams.query = {
            _id: { $in: notificationIds }
        };
        await this.update(
            {
                sendDate: new Date()
            },
            updateParams
        );
    }

    public async markNotificationAsPushed(notificationId: ObjectId): Promise<void> {
        const updateParams: UpdateParams = new UpdateParams();
        updateParams.query = {
            pushDate: null
        };
        await this.updateById(
            notificationId,
            {
                pushDate: new Date()
            },
            updateParams
        );
    }

    public async markUserNotificationsAsRead(userId: ObjectId): Promise<void> {
        const updateParams: UpdateParams = new UpdateParams(true);
        updateParams.query = {
            'userIdentity._id': userId,
            readStatus: { $in: [ReadStatus.Unread, null] }
        };
        await this.update(
            {
                readStatus: ReadStatus.Read
            },
            updateParams
        );
    }
    //Only Development Mode
    public async removeAllUserNotifications(userId: ObjectId): Promise<void> {
        // const updateParams: UpdateParams = new UpdateParams(true);
        // updateParams.query = {
        //     'userIdentity._id': userId
        // };
        // await this.deleteDoc(updateParams);
    }
    public async markNotificationAsRead(notificationId: ObjectId, userId: ObjectId): Promise<void> {
        const updateParams: UpdateParams = new UpdateParams();
        updateParams.query = {
            'userIdentity._id': userId,
            readStatus: { $in: [ReadStatus.Unread, null] }
        };
        await this.updateById(
            notificationId,
            {
                readStatus: ReadStatus.Read
            },
            updateParams
        );
    }
}
