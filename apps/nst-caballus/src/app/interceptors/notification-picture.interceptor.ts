import { Notification } from '@caballus/api-common';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PaginatedList } from '@rfx/common';
import { FileService } from '@rfx/nst-file';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class NotificationPictureInterceptor implements NestInterceptor {
    constructor(private readonly _fileService: FileService) {}

    private async _mapNotificationPicture(notification: Notification): Promise<Notification> {
        if (notification instanceof Notification === false) {
            return notification;
        }
        if (
            notification &&
            notification.userIdentity &&
            notification.userIdentity.profilePicture &&
            notification.userIdentity.profilePicture.path
        ) {
            const url = await this._fileService.getUrl(
                notification.userIdentity.profilePicture.path
            );
            notification.userIdentity.profilePicture.url = url;
        }
        if (
            notification &&
            notification.reactingUserIdentities &&
            notification.reactingUserIdentities.length &&
            notification.reactingUserIdentities.some(i => !!i.profilePicture && !!i.profilePicture.path)
        ) {
            notification.reactingUserIdentities = await Promise.all(
                notification.reactingUserIdentities.map(async r => {
                    if (r.profilePicture && r.profilePicture.path) {
                        const url = await this._fileService.getUrl(r.profilePicture.path);
                        r.profilePicture.url = url;
                    }
                    return r;
                })
            );
        }
        if (
            notification &&
            notification.connectedUserIdentity &&
            notification.connectedUserIdentity.profilePicture &&
            notification.connectedUserIdentity.profilePicture.path
        ) {
            const url = await this._fileService.getUrl(
                notification.connectedUserIdentity.profilePicture.path
            );
            notification.connectedUserIdentity.profilePicture.url = url;
        }
        return new Notification({ ...notification });
    }

    public intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<Notification | Notification[] | PaginatedList<Notification>> {
        return next.handle().pipe(
            switchMap((params: Notification | Notification[] | PaginatedList<Notification>) => {
                if (params instanceof PaginatedList) {
                    return from(
                        (async () =>
                            new PaginatedList<Notification>({
                                ...params,
                                docs: await Promise.all(
                                    params.docs.map(u => this._mapNotificationPicture(u))
                                )
                            }))()
                    );
                } else if (Array.isArray(params)) {
                    return from(Promise.all(params.map(u => this._mapNotificationPicture(u))));
                }
                return from(this._mapNotificationPicture(params));
            })
        );
    }
}
