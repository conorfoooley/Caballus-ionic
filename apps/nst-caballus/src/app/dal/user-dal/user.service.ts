import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotAcceptableException,
    NotFoundException
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { ObjectId } from '@rfx/njs-db/mongo';
import {
    FullUser,
    HorseProfileStatus,
    LoginType,
    MediaDocumentType,
    SubscriptionResponsibility,
    UploadedFileObject,
    User,
    UserGridParams,
    UserLogin,
    UserProfile,
    UserSettings
} from '@caballus/api-common';
import { PaginatedListModel } from '@rfx/nst-common';
import { AuthService } from '../auth-dal/auth.service';
import { RoleRepository } from './role.repository';
import { hash } from '@rfx/njs-security';
import { MediaService } from '../media-dal/media.service';
import { IdentitySyncService } from '../identity-sync-dal/identity-sync.service';
import { StripeService } from '../../library/services/stripe.service';
import { UserHorseRelationshipRepository } from './user-horse-relationship.repository';
import { HorseRepository } from './horse.repository';
import { MailerService } from '@rfx/njs-mailer';
import { UserNotificationSetting } from '@caballus/api-common';
import {
    DowngradeSubscriptionEmailTemplate,
    SubscriptionCancelEmailTemplate
} from '@nst-caballus/library';
import Stripe from 'stripe';
import { UserDisciplines } from '@caballus/common';

@Injectable()
export class UserService {
    constructor(
        private readonly _userRepo: UserRepository,
        private readonly _authService: AuthService,
        private readonly _roleRepo: RoleRepository,
        private readonly _mediaService: MediaService,
        private readonly _identitySyncService: IdentitySyncService,
        private readonly _stripeService: StripeService,
        private readonly _userHorseRelationshipRepository: UserHorseRelationshipRepository,
        private readonly _horseRepository: HorseRepository,
        private readonly _mailerService: MailerService
    ) {}

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    public async getUserById(id: ObjectId): Promise<User> {
        const u = await this._userRepo.getUserById(id);
        if (!!u) {
            if (!!u.profile.profilePicture && u.profile.profilePicture.path) {
                u.profile.profilePicture.url = await this._mediaService.getSignedUrl(
                    u.profile.profilePicture.path
                );
            }
            return u;
        } else {
            throw new BadRequestException('No User Found');
        }
    }

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    public async getIsTour(id: ObjectId): Promise<boolean> {
        return this._userRepo.getIsTour(id);
    }

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    public async endTour(id: ObjectId): Promise<void> {
        return this._userRepo.endTour(id);
    }

    public async getAllUsers(): Promise<UserProfile[]> {
        const userprofiles = (await this._userRepo.getAllUsers()).map(
            user => new UserProfile(user.profile)
        );
        for (const u of userprofiles) {
            if (!!u.profilePicture && u.profilePicture.path) {
                u.profilePicture.url = await this._mediaService.getSignedUrl(u.profilePicture.path);
            }
        }
        return userprofiles;
    }

    public async getProfileById(id: ObjectId): Promise<UserProfile> {
        const u = await this._userRepo.getUserById(id);
        if (!!u) {
            if (!!u.profile.profilePicture && u.profile.profilePicture.path) {
                u.profile.profilePicture.url = await this._mediaService.getSignedUrl(
                    u.profile.profilePicture.path
                );
            }
            return u.profile;
        } else {
            throw new BadRequestException('No User Found');
        }
    }

    public async getGridUsers(gridParams: UserGridParams): Promise<PaginatedListModel<User>> {
        return this._userRepo.getGridUsers(gridParams);
    }

    /**
     * Register a new user
     *
     * @returns The id of the newly inserted user
     * @param newUser
     */
    public async registerUser(newUser: {
        // TODO: ASAP fix registation logic for image upload
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        url: string;
        acceptedTerms: boolean;
    }): Promise<void> {
        if (!newUser.acceptedTerms) {
            throw new BadRequestException('Must accept terms');
        }
        const emailDuplicate = await this._userRepo.getUserByEmail(newUser.email);
        if (emailDuplicate) {
            throw new BadRequestException('Email taken');
        }
        const urlDuplicate = await this._userRepo.getUserByProfileUrl(newUser.url);
        if (urlDuplicate) {
            throw new BadRequestException('Profile url taken');
        }
        const role = await this._roleRepo.getNewUserDefaultRole();
        const _id = new ObjectId();

        const user = new FullUser({
            ...newUser,
            _id,
            roleIds: [role._id],
            profile: new UserProfile({
                ...newUser,
                _id
            }),
            settings: new UserSettings({
                ...newUser,
                verifyEmailDeadline: this._authService.calculateVerificationDeadline()
            }),
            deviceInfo: [],
            logins: [
                new UserLogin({
                    type: LoginType.Web,
                    key: await hash(newUser.password)
                })
            ]
        });

        if (!!user.profile.profilePicture && user.profile.profilePicture.path) {
            user.profile.profilePicture.url = await this._mediaService.getSignedUrl(
                user.profile.profilePicture.path
            );
        }

        await this._userRepo.createUser(user);
        await this._authService.sendAccountVerification(user.profile.email);
    }

    /**
     * Delete current user
     *
     * @returns void
     */
    public async deleteCurrentUser(currentUserId): Promise<void> {
        return this._userRepo.deleteUsersByIdList([currentUserId]);
    }

    /**
     * Delete roles by id list
     *
     * @param ids
     * @returns void
     */
    public async deleteUsersByIdList(ids: ObjectId[]): Promise<void> {
        return this._userRepo.deleteUsersByIdList(ids);
    }

    public async createUser(newUser: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        timezone: string;
        roleIds: ObjectId[];
    }): Promise<ObjectId> {
        const existingUser = await this._userRepo.getUserByEmail(newUser.email);
        if (!!existingUser) {
            throw new NotAcceptableException('User by that email already exists');
        }
        const selectedRoles = await this._roleRepo.getRolesByIdList(newUser.roleIds);
        if (selectedRoles.length !== newUser.roleIds.length) {
            throw new NotAcceptableException('Invalid roles selection');
        }
        const user = new FullUser({
            ...newUser,
            profile: new UserProfile({ ...newUser }),
            logins: [
                new UserLogin({
                    type: LoginType.Web,
                    key: null
                })
            ]
        });
        const userId = await this._userRepo.createUser(user);
        await this._authService.forgotPassword(user.profile.email);
        return userId;
    }

    public async editUser(
        userId: ObjectId,
        editedUser: {
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
        const existingUser = await this._userRepo.getUserById(userId);
        if (!!existingUser && existingUser.profile.email !== editedUser.email) {
            // Changing email
            const existingUserWithEmail = await this._userRepo.getUserByEmail(editedUser.email);
            if (!!existingUserWithEmail) {
                throw new NotAcceptableException('User by that email already exists');
            }
        }
        const selectedRoles = await this._roleRepo.getRolesByIdList(editedUser.roleIds);
        if (selectedRoles.length !== editedUser.roleIds.length) {
            throw new NotAcceptableException('Invalid roles selection');
        }
        const profile = new UserProfile({
            ...editedUser,
            _id: userId
        });
        const settings = new UserSettings({
            ...existingUser.settings,
            acceptedTerms: editedUser.acceptedTerms || false
        });
        const update = {
            profile,
            settings,
            roleIds: editedUser.roleIds
        };
        return this._userRepo.editUser(userId, update);
    }

    public async seenWelcomeModal(user: User): Promise<void> {
        user.settings.seenWelcomeModal = true;
        await this._userRepo.editUser(user._id, { settings: user.settings });
    }

    public async completedHisFirstRide(user: User): Promise<void> {
        user.settings.completedOneRide = true;
        await this._userRepo.editUser(user._id, { settings: user.settings });
    }

    public async allowCellularUpload(user: User, allowCellularUpload: boolean): Promise<void> {
        user.settings.uploadUsingCellularData = allowCellularUpload;
        await this._userRepo.editUser(user._id, { settings: user.settings });
    }

    public async editUserProfilePicture(
        image: UploadedFileObject,
        userId: ObjectId
    ): Promise<void> {
        const baseMedia = await this._mediaService.createBaseMediaDocument(
            MediaDocumentType.Image,
            image
        );
        await this._userRepo.editUserProfilePicture(userId, baseMedia);
        this._identitySyncService.syncUserIdentities(userId);
    }

    /**
     * Gets an active user by email id
     *
     * @returns The user or null if not found
     * @param email
     */
    public async getUserByEmail(email: string): Promise<User> {
        return this._userRepo.getUserByEmail(email);
    }

    /**
     * createStripeCustomer
     * Creates a new stripe customer for the given user.
     * @returns The Stripe Customer ID.
     * @param user
     * @param paymentMethod
     */
    public async createStripeCustomer(user: User, paymentMethod: string): Promise<string> {
        // create customer
        return this._stripeService.createCustomer({
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            email: user.profile.email,
            paymentMethod: paymentMethod
        });
    }

    /**
     * subscribeCustomer
     * @param userId
     * @param paymentMethod
     * @param payingForUserId
     */
    public async subscribeCustomer(
        userId: ObjectId,
        paymentMethod: string,
        payingForUserId: ObjectId,
        couponCode: string
    ): Promise<void> {
        // get user details
        const user = await this._userRepo.getUserById(userId);
        // Safety/sanity checks
        if (!user) {
            throw new NotFoundException('This user cannot be found.');
        }

        // get paying for user details
        const payingForUser = await this._userRepo.getUserById(payingForUserId);
        // Safety/sanity checks
        if (!!payingForUserId && !payingForUser) {
            throw new NotFoundException('This user cannot not found.');
        }

        // Check if user has a Stripe Customer ID. If not, create:
        let customerId = user.billing.customerId;
        if (!customerId) {
            customerId = await this.createStripeCustomer(user, paymentMethod);
        }

        //  get payment sources for the customer
        const paymentSources = await this._stripeService.getPaymentMethods(customerId);

        let subscription: Stripe.Subscription;
        if (!!user.billing.subscription) {
            // verify if subscription has items
            const subscriptionItem =
                user.billing.subscription.items &&
                user.billing.subscription.items.data &&
                user.billing.subscription.items.data[0]
                    ? user.billing.subscription.items.data[0]
                    : null;
            if (!subscriptionItem) {
                throw new NotFoundException('Subscription Item not found!');
            }

            // increase quantity in subscription item
            await this._stripeService.updateSubscriptionItem(subscriptionItem.id, {
                quantity: subscriptionItem.quantity + 1
            });

            // fetch subscription data
            subscription = await this._stripeService.getSubscriptionDetails(
                user.billing.subscription.id
            );
        } else {
            // Actually subscribe user:
            subscription = await this._stripeService.subscribe(
                customerId,
                paymentSources[0].id,
                userId.toHexString(),
                couponCode
            );
        }

        // Make sure the subscription actually worked:
        if (!subscription) {
            throw new ForbiddenException('This user does not have an active card.');
        }

        // verify if paying user is present, if yes than update billing details for him
        // if not then update current users billing details
        if (!!payingForUser) {
            delete payingForUser.modifiedDate;
            delete payingForUser.createdDate;

            // set stripe details in user
            payingForUser.billing.customerId = customerId;
            payingForUser.billing.subscription = subscription;
            payingForUser.billing.payingUser = user.profile;
            // update user profile
            await this._userRepo.editUser(payingForUser._id, payingForUser);
        } else {
            delete user.modifiedDate;
            delete user.createdDate;

            // set stripe details in user
            user.billing.customerId = customerId;
            user.billing.subscription = subscription;
            user.billing.payingUser = user.profile;
            // update user profile
            await this._userRepo.editUser(user._id, user);
        }
    }

    /**
     * userSubscriptionList
     * get user's subscription list
     * this will return all the user whose subscription is paid by the current user
     * @param userId
     */
    public async userSubscriptionList(userId: ObjectId): Promise<SubscriptionResponsibility[]> {
        const toMilliseconds = 1000;
        const subscriptionResponsibilities: SubscriptionResponsibility[] = [];

        // get list of users whose subscription is paid by the current user
        const subscribedUsers = await this._userRepo.userSubscriptionList(userId);

        // loop over users
        for (const subscribedUser of subscribedUsers) {
            // fetch enabled horses for the user
            const enabledHorses = await this._userHorseRelationshipRepository.getEnabledHorses(
                subscribedUser._id
            );

            // prepare the subscriptionResponsibilities object
            subscriptionResponsibilities.push({
                _id: subscribedUser._id,
                label: `${subscribedUser.profile.firstName} ${subscribedUser.profile.lastName}`,
                horseCount: enabledHorses.length,
                subscriptionId: subscribedUser.billing.subscription.id,
                since: new Date(subscribedUser.billing.subscription.created * toMilliseconds)
            });
        }

        return subscriptionResponsibilities;
    }

    public async userSubscriptionPaymentMethodList(
        customerId: string
    ): Promise<Stripe.PaymentMethod[]> {
        const customer = await this._stripeService.getCustomer(customerId);
        if (!customer || customer.deleted) {
            throw new NotFoundException('Customer not found!');
        }
        //  get payment sources for the customer
        return this._stripeService.getPaymentMethods(customerId);
    }

    /**
     * removeUserSubscription
     * It removes user subscription
     * @param subscriptionId
     * @param userId
     * @param loggedInUser
     */
    public async removeUserSubscription(
        subscriptionId: string,
        userId: ObjectId,
        loggedInUser: User
    ): Promise<void> {
        let user: User = null;
        let isUserDowngradingSubscription: boolean = false;
        if (userId.equals(loggedInUser._id)) {
            user = loggedInUser;
            isUserDowngradingSubscription = true;
        } else {
            // get user details
            user = await this._userRepo.getUserById(userId);
            isUserDowngradingSubscription = false;
        }

        // Safety/sanity checks
        if (!user) {
            throw new NotFoundException('This user cannot be found.');
        }

        // fetch subscription details
        const subscriptionDetails = await this._stripeService.getSubscriptionDetails(
            subscriptionId
        );
        if (!subscriptionDetails) {
            throw new NotFoundException('Subscription not found!');
        }

        // verify if subscription has items
        const subscriptionItem =
            subscriptionDetails.items &&
            subscriptionDetails.items.data &&
            subscriptionDetails.items.data[0]
                ? subscriptionDetails.items.data[0]
                : null;
        if (!subscriptionItem) {
            throw new NotFoundException('Subscription Item not found!');
        }
        // if there is only one quantity then cancel the subscription
        if (subscriptionItem.quantity === 1) {
            // cancel the subscription
            await this._stripeService.cancelSubscription(subscriptionId);
        } else {
            // decrease quantity from the subscription item
            await this._stripeService.updateSubscriptionItem(subscriptionItem.id, {
                quantity: subscriptionItem.quantity - 1
            });
        }

        // update user details
        delete user.modifiedDate;
        delete user.createdDate;

        // reset stripe details for the user
        user.billing.customerId = null;
        user.billing.subscription = null;
        user.billing.payingUser = new UserProfile();

        if (!isUserDowngradingSubscription) {
            // set settings.showSubscriptionCancelledPopup flag to true,
            // so we can utilise this flag on the front end to show account has been downgraded modal
            user.settings.showSubscriptionCancelledPopup = true;
        }

        // update user profile
        await this._userRepo.editUser(user._id, user);

        if (!isUserDowngradingSubscription) {
            // fetch enabled horses for the user
            const enabledHorses = await this._userHorseRelationshipRepository.getEnabledHorses(
                userId
            );
            // disable all horses except the first one
            await this._horseRepository.updateHorsesProfileStatusByIdList(
                enabledHorses.slice(1, enabledHorses.length).map(horse => horse.horse._id),
                HorseProfileStatus.Disabled
            );
        }

        // send a mail to the user about the subscription termination
        const mail = isUserDowngradingSubscription
            ? new DowngradeSubscriptionEmailTemplate(user)
            : new SubscriptionCancelEmailTemplate(user);
        mail.addTo(user.profile.email);
        try {
            // send mail
            await this._mailerService.send(mail);
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    /**
     * resetUserSubscriptionDowngradeFlag
     * It resets isSubscriptionCancelled flag for the user
     * @param userId
     */
    public async resetUserSubscriptionDowngradeFlag(userId: ObjectId): Promise<void> {
        // get user details
        const user = await this._userRepo.getUserById(userId);
        // Safety/sanity checks
        if (!user) {
            throw new NotFoundException('This user cannot be found.');
        }

        // update user details
        delete user.modifiedDate;
        delete user.createdDate;

        // reset isSubscriptionCancelled flag to false
        user.settings.showSubscriptionCancelledPopup = false;

        // update user profile
        await this._userRepo.editUser(user._id, user);
    }

    /**
     * Update user setting based on user id
     * @param userId
     * @param userNotificationSetting
     */
    public updateUserNotificationSetting(
        userId: ObjectId,
        userNotificationSetting: UserNotificationSetting
    ): Promise<void> {
        return this._userRepo.saveNotificationSetting(userId, userNotificationSetting);
    }

    /**
     * Gets user notification setting by user id
     *
     * @returns The user notification setting
     * @param id
     */
    public async getUserNotificationSetting(id: ObjectId): Promise<UserNotificationSetting> {
        return this._userRepo.getUserNotificationSetting(id);
    }

    /**
     * updateSubscriptionPaymentMethod
     * @param customerId
     * @param subscriptionId
     * @param oldPaymentMethod
     * @param newPaymentMethod
     */
    public async updateSubscriptionPaymentMethod(
        customerId: string,
        subscriptionId: string,
        oldPaymentMethod: string,
        newPaymentMethod: string
    ): Promise<void> {
        // update Subscription PaymentMethod
        await this._stripeService.updateSubscriptionPaymentMethod(
            customerId,
            subscriptionId,
            oldPaymentMethod,
            newPaymentMethod
        );
    }

    public async resetVerificationDeadline(email: string): Promise<void> {
        const newDate = this._authService.calculateVerificationDeadline();
        await this._userRepo.resetVerificationDeadline(email, newDate);
    }
}
