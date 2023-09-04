import { Injectable } from '@angular/core';
import { NotificationSummary } from '@caballus/common';
import { GridParams, PaginatedList } from '@rfx/common';
import { Body, Get, HttpService, MapClass, Path, Post, Put } from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import { Notification } from '../models';

@Injectable({
    providedIn: 'root'
})
export class NotificationService extends HttpService {
    @Get('/notifications/summary')
    @MapClass(NotificationSummary)
    public getNotificationSummary(): Observable<NotificationSummary> {
        return null;
    }

    @Post('/notifications/feed')
    public getNotificationFeed(
        @Body() params?: GridParams
    ): Observable<PaginatedList<Notification>> {
        return null;
    }

    @Put('/notifications/all-read')
    public markUserNotificationsAsRead(): Observable<void> {
        return null;
    }

    @Put('/notifications/:id/read')
    public markNotificationAsRead(@Path('id') notificationId: string): Observable<void> {
        return null;
    }
}
