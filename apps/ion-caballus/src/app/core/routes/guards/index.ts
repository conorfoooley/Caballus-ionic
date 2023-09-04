import { AuthGuard } from './auth.guard';
import { PermissionGuard } from './permission.guard';

export const guards = [AuthGuard, PermissionGuard];

export { AuthGuard, PermissionGuard };
