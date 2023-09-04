import { Injectable } from '@angular/core';
import { Body, Get, HttpService, Path, Post, Put, Query } from '@rfx/ngx-http';
import { Observable } from 'rxjs';
import { FriendRequestDto, Invitation, InvitationDetailed, UserProfileDto } from '../models';

export interface InvitationDto {
    recipientEmail: string;
    horseId: string;
}

export interface GeneralInvitationDto {
    toUserId: string;
    horseId: string;
    toRoleId: string;
}

@Injectable({providedIn: 'root'})
export class InvitationService extends HttpService {
    @Get('/invitation/:id')
    public getInvitationById(@Path('id') id: string): Observable<Invitation> {
        return null;
    }

    @Post('/invitation/transferOwnership')
    public createOwnershipTransferInvitation(@Body() dto: InvitationDto): Observable<string> {
        return null;
    }

    @Get('/invitation/transferOwnership/sent')
    public getSentOwnershipTransferInvitations(): Observable<Invitation[]> {
        return null;
    }

    @Put('/invitation/transferOwnership/retract/:id')
    public retractOwnershipTransferInivtation(@Path('id') horseId: string): Observable<void> {
        return null;
    }

    @Put('/invitation/transferOwnership/accept/:id')
    public acceptOwnershipTransferInvitation(@Path('id') inviteId: string): Observable<void> {
        return null;
    }

    @Put('/invitation/reject/:id')
    public rejectInvitation(@Path('id') inviteId: string): Observable<void> {
        return null;
    }

    @Post('/invitation/subscription-transfer')
    public subscriptionTransfer(@Body() user: UserProfileDto): Observable<string> {
        return null;
    }

    @Post('/invitation/subscription-transfer-details/')
    public subscriptionTransferDetails(@Body('id') invitationId: string): Observable<Invitation> {
        return null;
    }

    @Post('/invitation/subscription-transfer/accept')
    public acceptSubscriptionTransfer(@Body('id') invitationId: string): Observable<string> {
        return null;
    }

    @Post('/invitation/subscription-transfer/decline/')
    public declineSubscriptionTransfer(@Body('id') invitationId: string): Observable<string> {
        return null;
    }

    @Post('/invitation/friend-request')
    public friendRequest(@Body() user: FriendRequestDto): Observable<string> {
        return null;
    }

    @Post('/invitation/invite')
    public createGeneralInvitation(@Body() dto: GeneralInvitationDto): Observable<string> {
        return null;
    }

    @Put('/invitation/invite/retract/:id')
    public retractGeneralInvitation(@Path('id') horseId: string): Observable<void> {
        return null;
    }

    @Put('/invitation/invite/accept/:id')
    public acceptGeneralInvitation(@Path('id') inviteId: string): Observable<void> {
        return null;
    }

    @Get('/invitation/list/:id')
    public getInvitationDetailedListByHorseId(
        @Path('id') horseId: string,
        @Query('includeOwner') includeOwner?: boolean,
        @Query('onlySent') onlySent?: boolean
    ): Observable<InvitationDetailed[]> {
        return null;
    }
}
