import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { FriendModule } from './friend/friend/friend.module';
import { UserModule } from './user/user.module';
import { HorseModule } from './horse/horse.module';
import { NotificationModule } from './notification/notification.module';
import { RideModule } from './ride/ride.module';
import { GalleryModule } from './gallery/gallery.module';
import { InvitationModule } from './invitation/invitation.module';
import { HorseEvaluationModule } from './evaluation/evaluation.module';
import { HorseCompetitionModule } from './competition/competition.module';
import { MediaModule } from './media/media.module';

export const controllerModules = [
    AuthModule,
    RoleModule,
    UserModule,
    FriendModule,
    HorseModule,
    RideModule,
    GalleryModule,
    InvitationModule,
    NotificationModule,
    HorseEvaluationModule,
    HorseCompetitionModule,
    MediaModule
];
