import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    Body,
    Delete,
    Get,
    HttpService,
    MapClass,
    MapValue,
    Path,
    Post,
    Put,
    Query
} from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import {
    SubscriptionResponsibility,
    User,
    UserCreateDto,
    UserEditDto,
    UserProfile,
    UserToHorseSummary
} from '../models';
import { GridParams, PaginatedList } from '@rfx/common';
import {
    AllowNotificationSetting,
    Permission,
    SendNotificationSetting,
    UserNotificationSetting
} from '@caballus/common';
import * as jsonToFormData from 'json-form-data';
import Stripe from 'stripe';

interface UserRegistrationDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    url: string;
    acceptedTerm: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService extends HttpService {
    constructor(private _httpClient: HttpClient) {
        super(_httpClient);
    }

    @Get('/user')
    @MapClass(User)
    public getLoggedInUser(): Observable<User> {
        return null;
    }

    @Put('/user')
    public editLoginedUser(@Body() body: UserEditDto): Observable<void> {
        return null;
    }

    @Get('/user/all')
    @MapClass(UserProfile)
    public getAllUsers(): Observable<UserProfile[]> {
        return null;
    }

    @Post('/user/create')
    public createUser(@Body() body: UserCreateDto): Observable<void> {
        return null;
    }

    @Get('/user/:id')
    @MapClass(User)
    public getUser(@Path('id') id: string): Observable<User> {
        return null;
    }

    @Get('/user/:id/profile')
    @MapClass(UserProfile)
    public getProfile(@Path('id') id: string): Observable<UserProfile> {
        return null;
    }

    @Put('/user/:id')
    public editUser(@Path('id') id: string, @Body() body: UserCreateDto): Observable<void> {
        return null;
    }

    @Post('/user/list')
    @MapValue(
        res =>
            new PaginatedList<User>({
                count: res.count,
                docs: res.docs.map(d => new User(d))
            })
    )
    public getUserList(@Body() params: GridParams): Observable<PaginatedList<User>> {
        return null;
    }

    @Put('/user/seenWelcomeModal')
    public seenWelcomeModal(): Observable<any> {
        return null;
    }

    @Put('/user/completedHisFirstRide')
    public completedHisFirstRide(): Observable<any> {
        return null;
    }

    @Put('/user/allowCellularUpload')
    public allowCellularUpload(
        @Body('allowCellularUpload') allowCellularUpload: boolean
    ): Observable<any> {
        return null;
    }

    @Get('/user/permissions')
    public getUserPermissions(): Observable<Permission[]> {
        return null;
    }

    @Post('/user/register')
    public registerUser(@Body() dto: UserRegistrationDto): Observable<void> {
        return null;
    }

    @Post('/user/subscribe')
    public subscription(
        @Body('paymentMethod') paymentMethod: string,
        @Body('payingForUserId') payingForUserId?: string,
        @Body('couponCode') couponCode?: string
    ): Observable<void> {
        return null;
    }

    @Get('/user/subscription/list')
    public subscriptionList(): Observable<SubscriptionResponsibility[]> {
        return null;
    }

    @Post('/user/subscription/remove')
    public removeSubscription(
        @Body('subscriptionId') subscriptionId: string,
        @Body('userId') userId: string
    ): Observable<void> {
        return null;
    }

    @Get('/user/subscription/customer-payment-method-list')
    public subscriptionPaymentMethodList(
        @Query('customerId') customerId: string
    ): Observable<Stripe.PaymentMethod[]> {
        return null;
    }

    @Put('/user/subscription/update-subscription-payment-method')
    public updateSubscriptionPaymentMethod(
        @Body('customerId') customerId: string,
        @Body('subscriptionId') subscriptionId: string,
        @Body('oldPaymentMethod') oldPaymentMethod: string,
        @Body('newPaymentMethod') newPaymentMethod: string
    ): Observable<void> {
        return null;
    }

    @Put('/user/subscription/:id/reset-show-subscription-cancelled-popup-flag')
    public resetShowSubscriptionCancelledPopupFlag(@Path('id') id: string): Observable<void> {
        return null;
    }

    @Get('/user/impersonate/start/:id')
    public impersonate(
        @Path('id') id: string
    ): Observable<{ accessToken: string; refreshToken: string }> {
        return null;
    }

    @Get('/user/impersonate/stop')
    public stopImpersonation(): Observable<{ accessToken: string; refreshToken: string }> {
        return null;
    }

    @Get('/user/email')
    public getUserByEmail(@Query('email') email: string): Observable<User> {
        return null;
    }

    @Get('/user/viewableHorses')
    public getViewableHorses(@Query('id') id: string): Observable<UserToHorseSummary[]> {
        return null;
    }

    @Delete('/user/current')
    public deleteCurrentUser(): Observable<void> {
        return null;
    }

    /*
        The delete() method of Angular's HttpClient class
        does not directly support attaching a request body,
        so we need to use the request() method directly instead.

        Pat D Jun 23 2021
    */
    public deleteUsers(ids: string[]): Observable<void> {
        const options = {
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                ids: ids
            }
        };
        return this._httpClient.request<void>('delete', '/user', options);
    }

    public uploadImageToUserProfile(userId: string, imageBlob: Blob): Observable<void> {
        const formData = jsonToFormData({ id: userId });
        formData.append('file', imageBlob);
        return this._http.post<void>('/user/profilePicture', formData);
    }

    @Put('/user/userNotificationSetting')
    public updateUserNotificationSetting(
        @Body('allowNotificationSetting') allowNotificationSetting: AllowNotificationSetting,
        @Body('sendNotificationSetting') sendNotificationSetting: SendNotificationSetting
    ): Observable<void> {
        return null;
    }

    @Get('/user/userNotificationSetting')
    public getUserNotificationSetting(): Observable<UserNotificationSetting> {
        return null;
    }
}
