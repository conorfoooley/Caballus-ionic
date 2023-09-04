import { Injectable } from '@angular/core';
// eslint-disable-next-line
import { User } from '@caballus/ui-common';
import { Storage } from '@ionic/storage-angular';
import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { Drivers } from '@ionic/storage';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private _storage!: Storage;
    private _storageIndexDb!: Storage;

    // applicable to all users
    private readonly _commonPrefix: string = 'common-data-';
    private readonly _keyUser: string = this._commonPrefix + 'user';
    private readonly _keyAuthToken: string = this._commonPrefix + 'auth-token';
    private readonly _keyRefreshToken: string = this._commonPrefix + 'refresh-token';
    // applicable to current logged in user only
    private readonly _userPrefix: string = 'user-data-';
    constructor(private storage: Storage) {
    }

    /**
     * Initializes the backing storage to this service. MUST be called in
     * APP_INITIALIZER. {@see AppModule}
     */
    public async init(): Promise<void> {
        await this.storage.defineDriver(CordovaSQLiteDriver);
        this._storage = await this.storage.create();

        // index db drivers
        const instance = new Storage({
            name: 'indexedData',
            storeName: 'medias',
            driverOrder: [
                Drivers.IndexedDB
            ]
        });
        this._storageIndexDb = await instance.create();
    }

    private async _getUserKey(baseKey: string): Promise<string> {
        const user = await this.getUser();
        return !!user ? `${baseKey}${user._id}` : null;
    }

    public async setUser(user: User): Promise<void> {
        await this._storage.set(this._keyUser, JSON.stringify(user));
    }

    public async getUser(): Promise<User> {
        const json = await this._storage.get(this._keyUser);
        return !!json ? new User(JSON.parse(json)) : null;
    }

    public async clearUser(): Promise<void> {
        await this._storage.remove(this._keyUser);
    }

    public async setAuthToken(value: string): Promise<void> {
        await this._storage.set(this._keyAuthToken, value);
    }

    public async getAuthToken(): Promise<string> {
        const token = await this._storage.get(this._keyAuthToken);
        return !!token && typeof token === 'string' ? token : null;
    }

    public async clearAuthToken(): Promise<void> {
        await this._storage.remove(this._keyAuthToken);
    }

    public async setRefreshToken(refreshToken: string): Promise<void> {
        await this._storage.set(this._keyRefreshToken, refreshToken);
    }

    public async getRefreshToken(): Promise<string> {
        const token = await this._storage.get(this._keyRefreshToken);
        return !!token && typeof token === 'string' ? token : null;
    }

    public async clearRefreshToken(): Promise<void> {
        await this._storage.remove(this._keyRefreshToken);
    }

    public async getUserData<T = string>(subKey: string): Promise<T> {
        const key = await this._getUserKey(`${this._userPrefix}${subKey}`);
        const data = await this._storage.get(key);
        return !!data ? data : null;
    }

    public async setUserData<T = string>(subKey: string, data: T): Promise<void> {
        const key = await this._getUserKey(`${this._userPrefix}${subKey}`);
        await this._storage.set(key, data);
    }

    public async clearUserData(subKey: string): Promise<void> {
        const key = await this._getUserKey(`${this._userPrefix}${subKey}`);
        await this._storage.remove(key);
    }

    public async setUserDataToIndexDb<T = string>(subKey: string, data: T): Promise<void> {
        const key = await this._getUserKey(`${this._userPrefix}${subKey}`);
        await this._storageIndexDb.set(key, data);
    }

    public async getUserDataFromIndexDb<T = string>(subKey: string): Promise<T> {
        const key = await this._getUserKey(`${this._userPrefix}${subKey}`);
        const data = await this._storageIndexDb.get(key);
        return !!data ? data : null;
    }

    public async clearUserDataFromIndexDb(subKey: string): Promise<void> {
        const key = await this._getUserKey(`${this._userPrefix}${subKey}`);
        await this._storageIndexDb.remove(key);
    }

    public async setTour(): Promise<void> {
        await this._storage.set('tour', false);
    }

    public async getTour(): Promise<boolean> {
        return this._storage.get('tour');
    }
}
