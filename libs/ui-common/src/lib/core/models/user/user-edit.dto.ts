import { Timezone } from '@caballus/api-common';
import { UserCreateDto } from './user-create.dto';
import { User } from './user';

export class UserEditDto extends UserCreateDto {
    public url: string = '';
    public profilePicture: string = '';

    constructor(params?: Partial<UserEditDto>) {
        super(params);
        if (!!params) {
            this.url = params.url || this.url;
        }
    }

    public static from<T extends User>(type: new (params: Partial<T>) => T, value: T): UserEditDto {
        if (type === User) {
            return new UserEditDto({
                email: value.profile.email,
                firstName: value.profile.firstName,
                lastName: value.profile.lastName,
                phone: value.profile.phone,
                url: value.profile.url,
                roleIds: value.roleIds,
                disciplines: value.profile.disciplines
            });
        }

        return new UserEditDto();
    }
}
