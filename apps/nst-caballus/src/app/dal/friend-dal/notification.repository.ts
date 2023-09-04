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
     * Inserts a new notification into the DB
     *
     * @param notification
     * @returns The id of the newly inserted notification
     */
    public createNotification(notification: Notification): Promise<ObjectId> {
        return this.create(notification);
    }
}
