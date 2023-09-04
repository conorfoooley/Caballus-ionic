import { Injectable } from '@nestjs/common';
import {
    FindParams,
    MongoCollectionName,
    MongoRepository,
    numberMatch,
    ObjectId,
    stringLike,
    UpdateParams
} from '@rfx/nst-db/mongo';
import {
    BaseMediaDocument,
    FullUser,
    User,
    UserGridParams,
    UserNotificationSetting
} from '@caballus/api-common';
import { PaginatedList, Status } from '@rfx/common';
import { pipe } from 'rxjs';
import { MapClass } from '@rfx/nst-common';

@MongoCollectionName('user')
@Injectable()
export class UserRepository extends MongoRepository {
    /**
     * Gets an active user by their email address.
     *
     * Make sure the `status` field is included on the database index.
     *
     * @param email
     * @returns The user or null if not found
     */
    @MapClass(User)
    public async getUserByEmail(email: string): Promise<User> {
        const params = new FindParams({ query: { 'profile.email': email, status: Status.Active } });
        const u = await this.findOne<FullUser>(params);
        return !!u ? new User(u) : u;
    }

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    @MapClass(User)
    public async getUserById(id: ObjectId): Promise<User> {
        return this.findOneById<User>(id, new FindParams());
    }

    /**
     * Gets an active user isTour flag by their id
     *
     * @param id
     * @returns The user.isTour or null if not found
     */
    @MapClass(User)
    public async getIsTour(id: ObjectId): Promise<boolean> {
        return this.findOneById<User>(id, new FindParams()).then(res => res.isTour);
    }

    /**
     * Gets an active user by their id
     *
     * @param id
     * @returns The user or null if not found
     */
    @MapClass(User)
    public async endTour(id: ObjectId): Promise<void> {
        this.updateById(id, { isTour: false });
    }

    @MapClass(User)
    public async getAllUsers(): Promise<User[]> {
        const searchParams = new FindParams();
        searchParams.getAllResults(true);
        const users = await this.find<User>(searchParams);
        return users[0];
    }

    @MapClass(User)
    public async getUserByProfileUrl(url: string): Promise<User> {
        const params = new FindParams({ query: { 'profile.url': url } });
        const u = await this.findOne<User>(params);
        return !!u ? new User(u) : u;
    }

    public async getGridUsers(gridParams: UserGridParams): Promise<PaginatedList<User>> {
        const findParams = new FindParams(gridParams.grid);
        findParams.getCount = true;
        if (gridParams.filters.searchTerm.value) {
            findParams.query = pipe(
                stringLike(
                    ['profile.firstName', 'profile.lastName'],
                    gridParams.filters.searchTerm.value
                )
            )([]);
        }
        return new PaginatedList<User>(await this.find<User>(findParams), User);
    }

    /**
     * Inserts a new user into the DB
     *
     * @param user
     * @returns The id of the newly inserted user
     */
    public async createUser(user: FullUser): Promise<ObjectId> {
        return this.create(user);
    }

    /**
     * Permanently delete user profile --there's no going back from this one.
     *
     * @param id
     */
    public async hardDeleteUserById(id: ObjectId) {
        await this.deleteDocHardById(id);
    }

    /**
     * Delete roles by id list
     *
     * @param ids
     * @returns void
     */
    public async deleteUsersByIdList(ids: ObjectId[]): Promise<void> {
        const params = new UpdateParams();
        params.updateMultiple = true;
        params.query = pipe(numberMatch('status', Status.Active))([]);
        await this.updateByIdList(ids, { status: Status.InActive }, params);
    }

    /**
     * Edit a User
     *
     * @param id
     * @Param user
     * @returns void
     */
    public async editUser(id: ObjectId, user: Partial<User>): Promise<void> {
        await this.updateById(id, user);
    }

    public async editUserProfilePicture(id: ObjectId, image: BaseMediaDocument): Promise<void> {
        await this.updateById(id, { 'profile.profilePicture': image });
    }

    /**
     * userSubscriptionList
     * returns list of users whose subscription is paid by the given user
     * @param userId
     */
    public async userSubscriptionList(userId: ObjectId): Promise<User[]> {
        const params = new FindParams({
            query: {
                status: Status.Active,
                _id: { $ne: userId },
                'billing.payingUser._id': userId
            }
        });
        const users = await this.find<User>(params);
        return users[0];
    }

    /**
     * Update user setting based on user id
     * @param id
     * @param userNotificationSetting
     */
    public async saveNotificationSetting(
        id: ObjectId,
        userNotificationSetting: UserNotificationSetting
    ): Promise<void> {
        const params = new UpdateParams(false);
        const update = {
            userNotificationSetting: new UserNotificationSetting(userNotificationSetting)
        };
        await this.updateById(id, update, params);
    }

    /**
     * Get user notification setting
     * @param id
     */
    public async getUserNotificationSetting(id: ObjectId): Promise<UserNotificationSetting> {
        const u = await this.findOneById<User>(id, new FindParams());
        return u.userNotificationSetting;
    }

    @MapClass(User)
    public async resetVerificationDeadline(email: string, newDate: Date): Promise<User | null> {
        const collection = await this.getCollection();
        const query = {
            'profile.email': email,
            status: Status.Active
        };
        const update = {
            $set: {
                'settings.verifyEmailDeadline': newDate
            }
        };

        const result = await collection.findOneAndUpdate(query, update, {
            returnOriginal: false,
            collation: {
                locale: 'en',
                strength: 2
            }
        });

        if (!result.ok || !result.value) {
            return null;
        }

        return result.value;
    }
}
