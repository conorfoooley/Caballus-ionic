import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Body, Delete, Get, HttpService, MapClass, Path, Post, Put } from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import { Friend } from '../models/friend/friend';

@Injectable({
    providedIn: 'root'
})
export class FriendService extends HttpService {
    constructor(private _httpClient: HttpClient) {
        super(_httpClient);
    }

    @Post('/friend/:id')
    public createFriend(@Path('id') id: string): Observable<string> {
        return null;
    }

    @Get('/friend')
    public getAllFriends(): Observable<Friend[]> {
        return null;
    }

    @Get('/friend/:id')
    public getFriendById(@Path('id') id: string): Observable<Friend> {
        return null;
    }

    @Put('/friend/block/:id')
    public blockFriend(@Path('id') id: string): Observable<void> {
        return null;
    }

    @Put('/friend/unblock/:id')
    public unblockFriend(@Path('id') id: string): Observable<void> {
        return null;
    }
    @Delete('/friend/:id')
    public removeFriend(@Path('id') id: string): Observable<void> {
        return null;
    }

    @Put('/friend/accept/:id')
    public acceptFriendRequest(@Path('id') id: string): Observable<string> {
        return null;
    }

    @Put('/friend/reject/:id')
    public rejectFriendRequest(@Path('id') id: string): Observable<string> {
        return null;
    }
}
