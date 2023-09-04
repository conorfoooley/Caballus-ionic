import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import { IdDto, ObjectId } from '@rfx/nst-db/mongo';
import { Friend, User, FriendStatus } from '@caballus/api-common';
import { FriendService } from '../../../dal/friend-dal/friend.service';

@Controller('friend')
export class FriendController {
    constructor(private readonly _friendService: FriendService) {}

    @Get('')
    @ApiOperation({ summary: 'Get all friends of a user' })
    @Secured(WildCardPermission)
    public async getAllFriend(@LoggedInUser() user: User): Promise<Friend[]> {
        return this._friendService.getAllFriends(user._id);
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Get all friend Request by id' })
    @Secured(WildCardPermission)
    public async getFriendById(@Param() idDto: IdDto, @LoggedInUser() user: User): Promise<Friend> {
        return this._friendService.getFriendById(idDto.id, user);
    }

    @Post('/:id')
    @ApiOperation({ summary: 'Add Friend' })
    @Secured(WildCardPermission)
    public async createFriend(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<ObjectId> {
        return this._friendService.createFriend(idDto.id, user);
    }

    @Put('accept/:id')
    @ApiOperation({ summary: 'Accept Request' })
    @Secured(WildCardPermission)
    public async acceptFriendRequest(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        return this._friendService.changeFriendStatus(idDto.id, FriendStatus.Friends, user);
    }

    @Put('reject/:id')
    @ApiOperation({ summary: 'Reject Request' })
    @Secured(WildCardPermission)
    public async rejectFriendRequest(
        @Param() idDto: IdDto,
        @LoggedInUser() user: User
    ): Promise<void> {
        return this._friendService.changeFriendStatus(idDto.id, FriendStatus.Rejected, user);
    }

    @Put('block/:id')
    @ApiOperation({ summary: 'Block User' })
    @Secured(WildCardPermission)
    public async blockFriend(@Param() idDto: IdDto, @LoggedInUser() user: User): Promise<ObjectId> {
        return this._friendService.blockFriend(idDto.id, user);
    }
    @Put('unblock/:id')
    @ApiOperation({ summary: 'Block User' })
    @Secured(WildCardPermission)
    public async unblockFriend(@Param() idDto: IdDto, @LoggedInUser() user: User): Promise<ObjectId> {
        return this._friendService.unblockFriend(idDto.id, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove Friend' })
    @Secured(WildCardPermission)
    public async removeFriend(@Param() idDto: IdDto): Promise<void> {
        return this._friendService.removeFriend(idDto.id);
    }

    @Delete('')
    @ApiOperation({ summary: 'Remove All Friend' })
    @Secured(WildCardPermission)
    public async removeAllFriend(): Promise<void> {
        // return this._friendService.removeAllFriend();
    }
}
