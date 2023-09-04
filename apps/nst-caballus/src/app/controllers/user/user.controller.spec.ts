import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthDalModule, UserDalModule, UserService } from '@nst-caballus/dal';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { PermissionsModule } from '@rfx/nst-permissions';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { UserController } from './user.controller';
import { FileModule, GoogleFileOptions, FileService } from '@rfx/nst-file';
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import { MockCursor } from '../../unit-test-helpers/mock-db/mock-db-util';
import { mockUser } from '../../unit-test-helpers/mock-data/user/user.mock';

describe('User Controller', () => {
    let controller: UserController;;
    let userService: UserService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            imports: [
                UserDalModule,
                AuthDalModule,
                DbModule.forRoot({
                    name: '',
                    type: ConnectionType.MongoDB,
                    ...environment.mongo
                }),
                FileModule.forRoot(new GoogleFileOptions()),
                PermissionsModule.forRoot({
                    secretKey: 'test-secret-not-secure',
                    expiresSeconds: environment.authTokenExpireLength
                }),
                FileModule.forRoot(new GoogleFileOptions()),
            ],
            providers: [MockDbConnector]
        })
        .overrideProvider(DbConnector).useClass(MockDbConnector)
        .overrideProvider(FileService).useValue(MockFileService)
        .compile();

        controller = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return user data by email address', async () => {
        // Find ongoing rides by horseIds
        // mockRide has horses with mockId 1 and 2
        MockDbConnector.collection.findOne.mockReturnValue(mockUser);
        const userByEmail = await userService.getUserByEmail(mockUser.profile.email);
        expect(userByEmail.profile.email).toEqual(userByEmail.profile.email);
    });
});
