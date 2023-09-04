export * from './auth.actions';
export * from './user.actions';
export * from './friend.actions';
export * from './navigation.action';
export * from './media-upload-queue.action';

/**
 * Global action that gets dispatched at the end of APP_INITIALIZER to be used
 * for various initialization tasks in states.
 */
export class InitAction { public static readonly type = '[State] InitAction'; }
