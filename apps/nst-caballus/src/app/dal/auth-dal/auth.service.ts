import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { compareHash, hash } from '@rfx/njs-security';
import {
    LoginType,
    JwtPayload,
    JwtTokenType,
    User,
    JwtRefreshPayload,
    AuthError,
    ENABLE_VERIFIED_ACCOUNT_GATE
} from '@caballus/api-common';
import { TokenService } from '@rfx/nst-permissions';
import { MailerService } from '@rfx/nst-mailer';
import {
    BranchService,
    ForgotPasswordEmailTemplate,
    PasswordResetNotifyEmailTemplate,
    VerifyRegistrationEmailTemplate
} from '@nst-caballus/library';
import { ObjectId } from '@rfx/njs-db/mongo';
import { environment } from '@nst-caballus/env';
import { JwtService } from '@nestjs/jwt';
import { TokenRepository } from './token.repository';
import { addSeconds } from 'date-fns';

const MS_PER_SECOND = 1000;
// tslint:disable-next-line:no-magic-numbers
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
// tslint:disable-next-line:no-magic-numbers
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const HOURS_TO_VERIFY = 72;
const MS_TO_VERIFY = HOURS_TO_VERIFY * MS_PER_HOUR;
// tslint:disable-next-line:no-magic-numbers
const SEC_PER_WEEK = (MS_PER_HOUR * 24 * 7) / MS_PER_SECOND;

@Injectable()
export class AuthService {
    constructor(
        private readonly _authRepo: AuthRepository,
        private readonly _tokenRepo: TokenRepository,
        private readonly _tokenService: TokenService,
        private readonly _mailerService: MailerService,
        private readonly _branchService: BranchService
    ) {}

    public async getUserById(id: ObjectId): Promise<User> {
        return this._authRepo.getUserById(id);
    }

    /**
     * Login with an email and password, uses the LoginType.Web type login if
     * available and fails if an instance of the web login type doesn't exist
     * on the user.
     *
     * @param email
     * @param password
     * @returns A JWT that expires in whatever time is set in app.module.ts
     */
    public async login(
        email: string,
        password: string
    ): Promise<{ token: string; refresh: string; userId: ObjectId }> {
        const user = await this._authRepo.getUserByEmail(email);
        const login = user && user.logins.find(x => x.type === LoginType.Web);
        if (!(user && login && (await compareHash(password, login.key)))) {
            throw new BadRequestException('Wrong email/password combination');
        }
        if (ENABLE_VERIFIED_ACCOUNT_GATE) {
            this.verifiedAccountGate(user);
        }
        const token = await this.createAccessToken(user);
        const refresh = await this.getRefreshToken(user._id, user._id);
        return { token, refresh, userId: user._id };
    }

    public async createAccessToken(
        user: User,
        absoluteUserId?: ObjectId,
        tokenType: JwtTokenType = JwtTokenType.Standard
    ): Promise<string> {
        const userIdHex = user._id.toHexString();
        const absoluteUserIdHex = !!absoluteUserId ? absoluteUserId.toHexString() : null;
        const authTokenPayload = new JwtPayload(userIdHex, tokenType, absoluteUserIdHex);
        return this._tokenService.createToken(authTokenPayload);
    }

    /*
        Fetches an existing refresh token for the given
        user, or creates a new one if it does not exist
    */
    private async getRefreshToken(userId: ObjectId, absoluteUserId: ObjectId): Promise<string> {
        const user = await this._authRepo.getUserById(userId);
        if (!user) {
            throw new NotFoundException();
        }
        if (!!absoluteUserId) {
            const absoluteUser = await this._authRepo.getUserById(absoluteUserId);
            if (!absoluteUser) {
                throw new NotFoundException();
            }
        }
        /*
            Refresh tokens for Caballus will not expire
            to improve mobile app-side user experience
        */
        const existingToken = await this._tokenRepo.getTokenForUser(userId, absoluteUserId);
        const tokenId = !!existingToken
            ? existingToken._id
            : await this._tokenRepo.createToken(userId, null, absoluteUserId);
        const payload = new JwtRefreshPayload(
            tokenId.toHexString(),
            userId.toHexString(),
            JwtTokenType.Refresh,
            !!absoluteUserId ? absoluteUserId.toHexString() : null
        );
        return this._tokenService.createToken(payload);
    }

    public async isValidRefreshToken(
        refreshTokenId: ObjectId,
        userId: ObjectId,
        absoluteUserId?: ObjectId
    ): Promise<boolean> {
        return this._tokenRepo.isTokenActive(refreshTokenId, userId, absoluteUserId);
    }

    public async getJwtPayloadFromHeader(authHeader: string): Promise<JwtPayload> {
        return new JwtService({}).decode(authHeader.replace('Bearer ', '')) as JwtPayload;
    }

    public async createImpersonationTokens(
        absoluteUser: User,
        targetUser: User
    ): Promise<{ token: string; refresh: string }> {
        const payload = new JwtPayload(
            targetUser._id.toHexString(),
            JwtTokenType.Standard,
            absoluteUser._id.toHexString()
        );
        const token = await this._tokenService.createToken(payload);
        const refresh = await this.getRefreshToken(targetUser._id, absoluteUser._id);
        return { token, refresh };
    }

    public async impersonationStopTokens(
        absoluteUser: User
    ): Promise<{ token: string; refresh: string }> {
        const token = await this.createAccessToken(absoluteUser);
        const refresh = await this.getRefreshToken(absoluteUser._id, absoluteUser._id);
        return { token, refresh };
    }

    /**
     * Sends an email to the user given by email with a link that contains a
     * temporary token that gives them permission only to change password.
     *
     * This function does nothing and throws no errors if the user does not
     * exist.
     *
     * @param email
     */
    public async forgotPassword(email: string): Promise<void> {
        const user = await this._authRepo.getUserByEmail(email);
        if (!user || !user.logins.find(x => x.type === LoginType.Web)) {
            return;
        }

        // Create token that gives permission only to reset password for 30m
        const payload = new JwtPayload(user._id.toHexString(), JwtTokenType.PasswordReset);
        const expSeconds = 1800; // 30 minutes
        const token = await this._tokenService.createToken(payload, expSeconds);

        // Email user
        const normalUrl = `${environment.ionBaseUrl}/auth/reset?token=${token}`;
        const branchUrl = await this._branchService.createBranchUrl({
            appendUrl: `/auth/reset?token=${token}`,
            $desktop_url: normalUrl
        });
        const mail = new ForgotPasswordEmailTemplate(token, branchUrl);
        mail.addTo(email, user.profile.firstName + ' ' + user.profile.lastName);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            console.log(e);
            throw new InternalServerErrorException();
        }
    }

    /**
     * Sets the password for the given user and notifies them via email.
     *
     * @param email
     * @param password
     */
    public async resetPassword(email: string, password: string): Promise<void> {
        const newPasswordHash = await hash(password);
        await this._authRepo.updatePasswordHash(email, newPasswordHash);

        const mail = new PasswordResetNotifyEmailTemplate();
        mail.addTo(email);
        try {
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    public calculateVerificationDeadline(): Date {
        return new Date(new Date().getTime() + MS_TO_VERIFY);
    }

    public async sendAccountVerification(email: string): Promise<void> {
        const user = await this._authRepo.getUserByEmail(email);
        if (!!user && !user.settings.verifiedEmail) {
            const payload = new JwtPayload(user._id.toHexString(), JwtTokenType.VerifyEmail);
            const token = await this._tokenService.createToken(payload, MS_TO_VERIFY);

            // Email user
            const normalUrl = `${environment.ionBaseUrl}/auth/verify?token=${token}`;
            const branchUrl = await this._branchService.createBranchUrl({
                appendUrl: `/auth/verify?token=${token}`,
                $desktop_url: normalUrl
            });
            const mail = new VerifyRegistrationEmailTemplate(token, branchUrl);
            mail.addTo(user.profile.email);
            try {
                await this._mailerService.send(mail);
            } catch (e) {
                console.log(e);
                throw new InternalServerErrorException();
            }
        }
    }

    public verifiedAccountGate(user: User): void {
        const allow = user.settings.verifiedEmail || new Date() < user.settings.verifyEmailDeadline;
        if (!allow) {
            throw new UnauthorizedException(AuthError.VerificationDeadlinePassed);
        }
    }

    public async verifyAccount(user: User): Promise<void> {
        return this._authRepo.verifyAccount(user);
    }
}
