import { Notification, NotificationSummary, Permission, User } from '@caballus/api-common';
import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    Post,
    Put,
    UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiTags, ApiConsumes,  } from '@nestjs/swagger';
import { NotificationService } from '@nst-caballus/dal';
import { PaginatedList } from '@rfx/common';
import { IdDto } from '@rfx/nst-db/mongo';
import { LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import { NotificationPictureInterceptor } from '../../interceptors/notification-picture.interceptor';
import { NotificationParamsDto } from './dto/notification-params.dto';

@ApiBearerAuth()
@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly _notificationService: NotificationService) {}

    @Get('summary')
    @ApiOperation({ summary: 'Get user notification summary counted by notificationCategory' })
    @Secured(WildCardPermission)
    // @Secured(Permission.UserNotificationsView)
    public async getNotificationSummary(@LoggedInUser() user: User): Promise<NotificationSummary> {
        try {
            return await this._notificationService.getNotificationSummary(user._id);
        } catch (error) {
            throw new InternalServerErrorException(
                'An error occurred while retrieving notifications summary'
            );
        }
    }

    @Post('feed')
    @Secured(WildCardPermission)
    // @Secured(Permission.UserNotificationsView)
    @UseInterceptors(NotificationPictureInterceptor)
    public findNotificationsByUser(
        @LoggedInUser() user: User,
        @Body() params: NotificationParamsDto
    ): Promise<PaginatedList<Notification>> {
        return this._notificationService.findNotificationsByUserId(
            user._id,
            params.toNotificationGridParams()
        );
    }

    @Put(':id/read')
    @Secured(WildCardPermission)
    // @Secured(Permission.UserNotificationsCustomize)
    public async markNotificationAsRead(
        @LoggedInUser() user: User,
        @Param() idDto: IdDto
    ): Promise<void> {
        const notification = await this._notificationService.findNotificationById(idDto.id);
        if (!notification) {
            throw new NotFoundException();
        }
        return await this._notificationService.markNotificationAsRead(idDto.id, user._id);
    }

    @Put('all-read')
    @Secured(WildCardPermission)
    // @Secured(Permission.UserNotificationsCustomize)
    public markUserNotificationsAsRead(@LoggedInUser() user: User): Promise<void> {
        return this._notificationService.markUserNotificationsAsRead(user._id);
    }
    @Delete('all-delete')
    @Secured(WildCardPermission)
    // @Secured(Permission.UserNotificationsCustomize)
    public removeAllUserNotifications(@LoggedInUser() user: User) {
        return this._notificationService.removeAllUserNotifications(user._id);
    }
}
