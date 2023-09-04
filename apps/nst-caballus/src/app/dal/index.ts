import { AuthService } from './auth-dal/auth.service';
import { AuthDalModule } from './auth-dal/auth-dal.module';
import { UserService } from './user-dal/user.service';
import { UserDalModule } from './user-dal/user-dal.module';
import { NotificationDalModule } from './notification-dal/notification-dal.module';
import { NotificationService } from './notification-dal/notification.service';
import { RoleDalModule } from './role-dal/role-dal.module';
import { RoleService } from './role-dal/role.service';
import { FriendDalModule } from './friend-dal/friend.module';
import { FriendService } from './friend-dal/friend.service';
import { MediaDalModule } from './media-dal/media-dal.module';
import { MediaService } from './media-dal/media.service';
import { HorseDalModule } from './horse-dal/horse-dal.module';
import { HorseService } from './horse-dal/horse.service';
import { RideDalModule } from './ride-dal/ride-dal.module';
import { RideService } from './ride-dal/ride.service';
import { IdentitySyncDalModule } from './identity-sync-dal/identity-sync-dal.module';
import { IdentitySyncService } from './identity-sync-dal/identity-sync.service';
import { InvitationDalModule } from './invitation-dal/invitation-dal.module';
import { InvitationService } from './invitation-dal/invitation.service';
import { HorseRoleDalModule } from './horse-role-dal/horse-role-dal.module';
import { HorseRoleService } from './horse-role-dal/horse-role.service';
import { UserHorseRelationshipDalModule } from './user-horse-relationship-dal/user-horse-relationship-dal.module';
import { UserHorseRelationshipService } from './user-horse-relationship-dal/user-horse-relationship.service';
import { HorseEvaluationDalModule } from './horse-evaluation-dal/horse-evaluation-dal.module';
import { HorseEvaluationService } from './horse-evaluation-dal/horse-evaluation.service';
import { HorseCompetitionDalModule } from './horse-competition-dal/horse-competition-dal.module';
import { HorseCompetitionService } from './horse-competition-dal/horse-competition.service';
import { UserLogDalModule } from './user-log-dal/user-log-dal.module';
import { UserLogService } from './user-log-dal/user-log.service';

export const dalModules = [
    AuthDalModule,
    FriendDalModule,
    RoleDalModule,
    UserDalModule,
    MediaDalModule,
    HorseDalModule,
    RideDalModule,
    IdentitySyncDalModule,
    InvitationDalModule,
    HorseRoleDalModule,
    UserHorseRelationshipDalModule,
    HorseEvaluationDalModule,
    UserLogDalModule,
    NotificationDalModule
];

export {
    AuthService,
    FriendService,
    FriendDalModule,
    AuthDalModule,
    MediaService,
    RoleService,
    RoleDalModule,
    UserService,
    UserDalModule,
    NotificationDalModule,
    MediaDalModule,
    NotificationService,
    HorseService,
    HorseDalModule,
    RideService,
    RideDalModule,
    IdentitySyncService,
    IdentitySyncDalModule,
    InvitationDalModule,
    InvitationService,
    HorseRoleDalModule,
    HorseRoleService,
    UserHorseRelationshipDalModule,
    UserHorseRelationshipService,
    HorseEvaluationDalModule,
    HorseEvaluationService,
    HorseCompetitionDalModule,
    HorseCompetitionService,
    UserLogService
};
