import { Injectable } from '@angular/core';
import { UserDeviceInfo } from '@caballus/common';
import { HttpService, Post, Body, ResponseType, Header, Get, Put } from '@rfx/ngx-http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService extends HttpService {
    @Post('/auth/login')
    public tryLogin(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('deviceInfo') deviceInfo: UserDeviceInfo
    ): Observable<{ token: string; refresh: string }> {
        return null;
    }

    @Get('/auth/refresh', { responseType: ResponseType.Text })
    public refresh(
        @Header('Authorization') refreshToken: string
    ): Observable<string> {
        return null;
    }

    @Post('/auth/forgotPassword')
    public forgotPassword(@Body('email') email: string): Observable<boolean> {
        return null;
    }

    @Post('/auth/resetPassword')
    public resetPassword(
        @Header('Authorization') token: string,
        @Body('password') newPassword: string
    ): Observable<boolean> {
        return null;
    }

    @Put('/auth/verify')
    public verifyAccount(
        @Header('Authorization') verifyToken: string
    ): Observable<void> {
        return null;
    }

    @Post('/auth/resendVerification')
    public resendVerification(
        @Body('email') email: string
    ): Observable<void> {
        return null;
    }

    @Post('/auth/accountSubscriptionToken')
    public generateAccountSubscriptionToken(): Observable<{ token: string }> {
        return null;
    }
}
