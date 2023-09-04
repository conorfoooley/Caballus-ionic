import { AuthState } from './auth.state';
import { UserState } from './user.state';
import { FriendState } from './friend.state';
import { AppState } from './app.state';
import { RideState } from './ride.state';
import { NavigationState } from './navigation.state';
import { MediaUploadQueueState } from './media-upload-queue.state';

export const states = [AppState, AuthState, UserState, FriendState, RideState, MediaUploadQueueState, NavigationState];

export {AppState, AuthState, UserState, FriendState, RideState, MediaUploadQueueState, NavigationState};

// Global actions
export { InitAction } from './actions';
