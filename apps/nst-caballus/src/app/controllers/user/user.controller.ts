import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Delete,
    Put,
    Headers,
    NotAcceptableException,
    BadRequestException,
    UploadedFile,
    UseInterceptors,
    Query
} from '@nestjs/common';
import { AuthService, UserService } from '@nst-caballus/dal';
import { LoggedInUser, Secured, Anonymous, WildCardPermission } from '@rfx/nst-permissions';
import {
    ApiBadRequestResponse,
    ApiConsumes,
    ApiNotAcceptableResponse,
    ApiOkResponse,
    ApiOperation
} from '@nestjs/swagger';
import {
    User,
    Permission,
    UploadedFileObject,
    UserProfile,
    UserNotificationSetting,
    UserToHorseSummary
} from '@caballus/api-common';
import { PaginatedListModel } from '@rfx/common';
import { UserCreateDto } from './dto/user-create.dto';
import { UserEditDto } from './dto/user-edit.dto';
import { UserParamsDto } from './dto/user-params.dto';
import { ObjectId, IdDto, parseObjectId } from '@rfx/nst-db/mongo';
import { UserRegistrationDto } from './dto/user-registration-dto';
import { IdListDto } from '../id-list.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserHorseRelationshipService } from '../../dal/user-horse-relationship-dal/user-horse-relationship.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RemoveUserSubscriptionDto } from './dto/remove-user-subscription.dto';
import { SubscriptionResponsibility } from '@caballus/api-common';
import Stripe from 'stripe';
import { UpdateSubscriptionPaymentMethodDto } from './dto/update-subscription-payment-method.dto';
import { UserNotificationSettingDto } from './dto/user-notification-setting.dto';
import { UserDisciplines } from '@caballus/common';

@Controller('user')
export class UserController {
    constructor(
        private readonly _userService: UserService,
        private readonly _userHorseService: UserHorseRelationshipService,
        // private readonly _mediaService: MediaService,
        private readonly _authService: AuthService
    ) {}

    @Get('')
    @ApiOperation({ summary: 'Get Logged In User' })
    @Secured(WildCardPermission)
    public async getLoggedInUser(@LoggedInUser() user: User): Promise<User> {
        // if (!!user.profile.profilePicture && user.profile.profilePicture.path) {
        //     user.profile.profilePicture.url = await this._mediaService.getSignedUrl(
        //         user.profile.profilePicture.path
        //     );
        // }
        return user;
    }

    @Put('')
    @ApiOperation({ summary: 'Edit Logged In User data' })
    @Secured(WildCardPermission)
    public async editLoginedUser(
        @LoggedInUser() user: User,
        @Body()
        dto: {
            email: string;
            firstName: string;
            lastName: string;
            url: string;
            phone: string;
            // timezone: string;
            roleIds: ObjectId[];
            disciplines: UserDisciplines[];
            acceptedTerms: boolean;
        }
    ): Promise<void> {
        return this._userService.editUser(user._id, { ...dto, roleIds: user.roleIds });
    }

    @Get('all')
    @ApiOperation({ summary: 'Get All Users' })
    @Secured(WildCardPermission)
    public async getUsersAllUsers(): Promise<UserProfile[]> {
        return this._userService.getAllUsers();
    }

    @Get('tour')
    @ApiOperation({ summary: 'Display tour guide' })
    @Secured(WildCardPermission)
    public async tour(@LoggedInUser() user: User): Promise<boolean> {
        // return this._userService.getAllUsers();
        return this._userService.getIsTour(user._id);
    }

    @Put('end-tour')
    @ApiOperation({ summary: 'Display tour guide' })
    @Secured(WildCardPermission)
    public async endTour(@LoggedInUser() user: User): Promise<void> {
        // return this._userService.getAllUsers();
        return this._userService.endTour(user._id);
    }

    @Delete('')
    @Secured(Permission.UserDelete)
    public async deleteRoles(@Body() idListDto: IdListDto): Promise<void> {
        return this._userService.deleteUsersByIdList(idListDto.ids);
    }

    @Delete('/current')
    @ApiOperation({ summary: 'Remove the current user' })
    @Secured(WildCardPermission)
    public async deleteCurrentUser(@LoggedInUser() user: User) {
        return this._userService.deleteCurrentUser(user._id);
    }

    @Get('permissions')
    @ApiOperation({ summary: 'Get Logged In User Permissions' })
    @ApiOkResponse({ description: 'User Permissions', type: [String] })
    @Secured(WildCardPermission)
    public async getLoggedInUserPermissions(@LoggedInUser() user: User): Promise<string[]> {
        return user.permissions;
    }

    @Post('list')
    @ApiOperation({
        summary: 'User List'
    })
    @Secured(Permission.UserView)
    public async listUsers(@Body() dto: UserParamsDto): Promise<PaginatedListModel<User>> {
        return this._userService.getGridUsers(dto.toUserGridParams());
    }

    @Post('create')
    @ApiOperation({ summary: 'Create User' })
    @Secured(Permission.UserCreate)
    public async createUser(@Body() dto: UserCreateDto): Promise<ObjectId> {
        return this._userService.createUser(dto);
    }

    @Put('seenWelcomeModal')
    @ApiOperation({ summary: 'Mark that the user has seen the welcome modal' })
    @Secured(WildCardPermission)
    public seenWelcomeModal(@LoggedInUser() user: User): Promise<void> {
        return this._userService.seenWelcomeModal(user);
    }

    @Put('completedHisFirstRide')
    @ApiOperation({ summary: 'Mark that the user has completed his firts ride' })
    @Secured(WildCardPermission)
    public completedHisFirstRide(@LoggedInUser() user: User): Promise<void> {
        return this._userService.completedHisFirstRide(user);
    }

    @Put('allowCellularUpload')
    @ApiOperation({ summary: 'Mark that the user has seen the welcome modal' })
    @Secured(WildCardPermission)
    public allowCellularUpload(
        @LoggedInUser() user: User,
        @Body('allowCellularUpload') allowCellularUpload: boolean
    ): Promise<void> {
        return this._userService.allowCellularUpload(user, allowCellularUpload);
    }

    @Post('register')
    @ApiOperation({ summary: 'Registration' })
    @Anonymous()
    public async registerUser(@Body() dto: UserRegistrationDto): Promise<void> {
        return this._userService.registerUser(dto);
    }

    @Get('/email')
    @ApiOperation({ summary: 'Get User By email' })
    @Secured(WildCardPermission)
    public async getUserByEmail(@Query('email') email: string): Promise<User> {
        return this._userService.getUserByEmail(email);
    }

    @Get('/viewableHorses')
    @ApiOperation({ summary: `Get all viewable Friend's horses` })
    @Secured(WildCardPermission)
    public async getViewableHorses(
        @LoggedInUser() loggedInUser: User,
        @Query() idDto: IdDto
    ): Promise<UserToHorseSummary[]> {
        return this._userHorseService.getViewableHorses(idDto.id, loggedInUser._id);
    }

    @Get('/userNotificationSetting')
    @ApiOperation({ summary: 'Get User Notification Setting' })
    @Secured(WildCardPermission)
    public async getUserNotificationSetting(
        @LoggedInUser() loggedInUser: User
    ): Promise<UserNotificationSetting> {
        return this._userService.getUserNotificationSetting(loggedInUser._id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get User By Id' })
    @Secured(Permission.UserView)
    public async getRole(@Param() idDto: IdDto): Promise<User> {
        return this._userService.getUserById(idDto.id);
    }

    @Get(':id/profile')
    @ApiOperation({ summary: 'Get User By Id' })
    @Secured(WildCardPermission)
    public async getProfile(@Param() idDto: IdDto): Promise<UserProfile> {
        return this._userService.getProfileById(idDto.id);
    }

    @Post('profilePicture')
    @ApiOperation({ summary: 'Edit Logged In User Profile Picture' })
    @Secured(WildCardPermission)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20000000 } }))
    public async editUserProfilePicture(
        @UploadedFile() file: UploadedFileObject,
        @LoggedInUser() user: User
    ): Promise<void> {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return this._userService.editUserProfilePicture(file, user._id);
    }

    @Put('userNotificationSetting')
    @ApiOperation({ summary: 'Save/Update user notification setting' })
    @Secured(WildCardPermission)
    public async updateUserNotificationSetting(
        @LoggedInUser() lUser: User,
        @Body() userNotificationSettingDto: UserNotificationSettingDto
    ): Promise<void> {
        return this._userService.updateUserNotificationSetting(
            lUser._id,
            userNotificationSettingDto
        );
    }

    @Put(':id')
    @ApiOperation({ summary: 'Edit User' })
    @Secured(Permission.UserEdit)
    public async editUser(@Param() idDto: IdDto, @Body() dto: UserEditDto): Promise<void> {
        return this._userService.editUser(idDto.id, dto);
    }

    @Get('impersonate/start/:id')
    @ApiOperation({ summary: 'Imperonsate selected user' })
    @ApiOkResponse({ description: 'New JWT token' })
    @ApiNotAcceptableResponse({
        description: 'already impersonating or trying to self impersonate'
    })
    @Secured(Permission.UserImpersonate)
    public async impersonateStart(
        @Headers('authorization') authHeader: string,
        @Param() idDto: IdDto,
        @LoggedInUser() loggedInUser: User
    ): Promise<{ token: string; refresh: string }> {
        const payload = await this._authService.getJwtPayloadFromHeader(authHeader);
        if (payload.absoluteUserId !== payload.userId) {
            throw new NotAcceptableException('Already impersonating');
        }
        if (loggedInUser._id.equals(idDto.id)) {
            throw new NotAcceptableException('Cannot impersonate self');
        }
        const targetUser = await this._userService.getUserById(idDto.id);
        if (!targetUser) {
            throw new BadRequestException('Invalid user selection');
        }
        return await this._authService.createImpersonationTokens(loggedInUser, targetUser);
    }

    @Get('impersonate/stop')
    @ApiOperation({ summary: 'Stop impersonation and resume original user identity' })
    @ApiOkResponse({ description: 'New JWT token' })
    @ApiBadRequestResponse({ description: 'if the user is not impersonating' })
    @Secured(WildCardPermission)
    public async impersonateStop(
        @Headers('authorization') authHeader: string,
        @LoggedInUser() loggedInUser: User
    ): Promise<{ token: string; refresh: string }> {
        const payload = await this._authService.getJwtPayloadFromHeader(authHeader);
        let absoluteUserId: ObjectId = null;
        try {
            absoluteUserId = parseObjectId(payload.absoluteUserId);
        } catch (e) {
            // valid impersonation must provide absolute user id
            throw new BadRequestException('not impersonating');
        }
        if (absoluteUserId.equals(loggedInUser._id)) {
            // not impersonating
            throw new BadRequestException('not impersonating');
        }
        const absoluteUser = await this._userService.getUserById(absoluteUserId);
        if (!absoluteUser) {
            // if absolute user doesn't exist send empty token to force logout
            return { token: null, refresh: null };
        }
        return await this._authService.impersonationStopTokens(absoluteUser);
    }

    @Post('subscribe')
    @ApiOperation({ summary: 'Subscribe a user to the Caballus paid plan' })
    @Secured(WildCardPermission)
    public async subscribe(
        @Body() dto: CreateSubscriptionDto,
        @LoggedInUser() loggedInUser: User
    ): Promise<void> {
        return await this._userService.subscribeCustomer(
            loggedInUser._id,
            dto.paymentMethod,
            dto.payingForUserId,
            dto.couponCode
        );
    }

    @Get('subscription/list')
    @ApiOperation({ summary: 'User subscription list for the Caballus paid plan' })
    @Secured(WildCardPermission)
    public async subscriptionList(
        @LoggedInUser() loggedInUser: User
    ): Promise<SubscriptionResponsibility[]> {
        return await this._userService.userSubscriptionList(loggedInUser._id);
    }

    @Get('subscription/customer-payment-method-list')
    @ApiOperation({ summary: 'User subscription payment method list' })
    @Secured(WildCardPermission)
    public async subscriptionPaymentMethodList(
        @Query('customerId') id: string
    ): Promise<Stripe.PaymentMethod[]> {
        return await this._userService.userSubscriptionPaymentMethodList(id);
    }

    @Post('subscription/remove')
    @ApiOperation({ summary: 'Remove user subscription for the Caballus paid plan' })
    @Secured(WildCardPermission)
    public async removeSubscription(
        @Body() dto: RemoveUserSubscriptionDto,
        @LoggedInUser() loggedInUser: User
    ): Promise<void> {
        return await this._userService.removeUserSubscription(
            dto.subscriptionId,
            dto.userId,
            loggedInUser
        );
    }

    @Put('subscription/:id/reset-show-subscription-cancelled-popup-flag')
    @ApiOperation({ summary: 'Reset isSubscriptionCancelled flag for the user' })
    @Secured(WildCardPermission)
    public async resetUserSubscriptionDowngradeFlag(@Param() idDto: IdDto): Promise<void> {
        return await this._userService.resetUserSubscriptionDowngradeFlag(idDto.id);
    }

    @Put('subscription/update-subscription-payment-method')
    @ApiOperation({ summary: 'Update default payment method for the subscription' })
    @Secured(WildCardPermission)
    public async updateSubscriptionPaymentMethod(
        @Body() dto: UpdateSubscriptionPaymentMethodDto
    ): Promise<void> {
        return await this._userService.updateSubscriptionPaymentMethod(
            dto.customerId,
            dto.subscriptionId,
            dto.oldPaymentMethod,
            dto.newPaymentMethod
        );
    }
}
