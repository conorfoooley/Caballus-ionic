import { Test, TestingModule } from '@nestjs/testing';
import { AuthDalModule, AuthService } from '@nst-caballus/dal';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { PermissionsModule } from '@rfx/nst-permissions';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { AuthController } from './auth.controller';

describe('Auth Controller Test', () => {
    let controller: AuthController;
    let authService: AuthService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            imports: [
                AuthDalModule,
                DbModule.forRoot({
                    name: '',
                    type: ConnectionType.MongoDB,
                    ...environment.mongo
                }),
                PermissionsModule.forRoot({
                    secretKey: 'test-secret-not-secure',
                    expiresSeconds: environment.authTokenExpireLength
                })
            ],
            providers: [MockDbConnector]
        })
        .overrideProvider(DbConnector).useClass(MockDbConnector)
        .compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
