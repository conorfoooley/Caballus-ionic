import { ConnectionIdentity, User } from '../models';

export function connectionIdentityFromUser(user: User): ConnectionIdentity {
    return new ConnectionIdentity({
        ...user,
        displayName:
            user.profilePublic && user.profile.firstName
                ? `${user.profile.firstName} ${user.profile.lastName}`
                : user.displayName
    });
}
