import { BadRequestException, Body, Controller, Get, Headers, Post, Put } from '@nestjs/common';
import { AuthService, UserLogService, UserService } from '@nst-caballus/dal';
import { Anonymous, LoggedInUser, Secured, WildCardPermission } from '@rfx/nst-permissions';
import { LoginDto } from '../login-dto';
import { ForgotDto } from './dto/forgot-dto';
import { ResetDto } from './dto/reset-dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ENABLE_VERIFIED_ACCOUNT_GATE, JwtRefreshPayload, JwtTokenType, Permission, User } from '@caballus/api-common';
import { JwtService } from '@nestjs/jwt';
import { ObjectId, parseObjectId } from '@rfx/njs-db/mongo';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly _authService: AuthService,
        private readonly _userLogService: UserLogService,
        private readonly _userService: UserService
    ) {}

    @Post('login')
    @ApiOperation({ summary: 'Login' })
    @Anonymous()
    public async login(@Body() loginDto: LoginDto): Promise<{ token: string; refresh: string }> {
        const loginInfo = await this._authService.login(loginDto.email, loginDto.password);
        await this._userLogService.saveUserLoginEnvInfo(loginInfo.userId, loginDto.deviceInfo);
        return {
            token: loginInfo.token,
            refresh: loginInfo.refresh
        };
    }

    @Get('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @Anonymous()
    public async refresh(
        @Headers('authorization') authHeader: string
    ): Promise<string> {
        // pull the refresh payload from the authentication header
        const jwtService = new JwtService({});
        const refreshPayload: JwtRefreshPayload = jwtService.decode(
            authHeader.replace('Bearer ', '')
        ) as JwtRefreshPayload;

        if (!refreshPayload || refreshPayload.tokenType !== JwtTokenType.Refresh) {
            throw new BadRequestException('Token of type refresh token is required');
        }

        let userId: ObjectId = null;
        let absoluteUserId: ObjectId = null;

        try {
            userId = parseObjectId(refreshPayload.userId);
            absoluteUserId = parseObjectId(refreshPayload.absoluteUserId);
        } catch (e) {
            throw new BadRequestException('Invalid refresh request');
        }
        /*
            Check if the refresh token is valid, or if the token has expired
            in the case of a token created with an optional expiry date
        */
        const isValidRefreshToken = await this._authService.isValidRefreshToken(
            parseObjectId(refreshPayload.refreshId),
            userId,
            absoluteUserId
        );

        if (refreshPayload.tokenType === JwtTokenType.Refresh && isValidRefreshToken) {
            const user = await this._authService.getUserById(userId);
            if (ENABLE_VERIFIED_ACCOUNT_GATE) {
                this._authService.verifiedAccountGate(user);
            }
            // create a new access token as long as the refresh token is valid
            return this._authService.createAccessToken(
                user,
                absoluteUserId
            );
        }

        throw new BadRequestException();
    }

    @Post('forgotPassword')
    @ApiOperation({
        summary: 'Forgot Password',
        description: `Send an email to the user with a token that can be used \
        to access the "resetPassword" endpoint for changing the user's password`
    })
    @Anonymous()
    public async forgotPassword(@Body() forgotDto: ForgotDto): Promise<void> {
        return this._authService.forgotPassword(forgotDto.email);
    }

    @Post('resetPassword')
    @ApiOperation({
        summary: 'Reset Password',
        description: `Reset the password for the current user using a reset \
        token generated with the "forgotPassword" endpoint`
    })
    @ApiBearerAuth()
    @Secured(Permission.ResetPassword)
    public async resetPassword(
        @LoggedInUser() user: User,
        @Body() resetDto: ResetDto
    ): Promise<void> {
        // The permission required to access this endpoint is unlisted and
        // should not be put on any roles; it should only be given to the reset
        // token which should also have no other permissions. See the
        // JwtStrategy.validate() method for how it's used.
        return this._authService.resetPassword(user.profile.email, resetDto.password);
    }

    @Post('resendVerification')
    @ApiOperation({
        summary: 'Resend Account Verification Email',
        description: 'Trigger a new email for user containing a link \
            with embedded token to verify their account'
    })
    @Anonymous()
    public async resendAccountVerificationEmail(
        @Body() resendDto: ResendVerificationDto
    ): Promise<void> {
        await this._userService.resetVerificationDeadline(resendDto.email);
        return this._authService.sendAccountVerification(resendDto.email);
    }

    @Put('verify')
    @ApiOperation({
        summary: 'Verify Account Email',
        description: 'User submits proof that they own the email \
            address associated with their account'
    })
    @Secured(Permission.VerifyEmail)
    public async verifyAccount(
        @LoggedInUser() lUser: User
    ): Promise<void> {
        if (ENABLE_VERIFIED_ACCOUNT_GATE) {
            this._authService.verifiedAccountGate(lUser);
        }
        return this._authService.verifyAccount(lUser);
    }

    @Post('accountSubscriptionToken')
    @ApiOperation({ summary: 'Login' })
    @Secured(WildCardPermission)
    public async generateAccountSubscriptionToken(@LoggedInUser() lUser: User): Promise<{ token: string }> {
        const token = await this._authService.createAccessToken(
            lUser,
            null,
            JwtTokenType.Subscription
        );
        return {
            token
        };
    }
}
