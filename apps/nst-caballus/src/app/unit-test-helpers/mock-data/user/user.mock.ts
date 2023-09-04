import { User, UserProfile } from '@caballus/api-common';
import { mockId } from '../../mock-db/mock-db-util';

export const mockUser = new User({
    _id: mockId(1),
    profile: new UserProfile({
        _id: mockId(1),
        firstName: 'Test',
        lastName: 'User'
    })
});
