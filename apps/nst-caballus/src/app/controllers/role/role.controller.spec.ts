import { Test, TestingModule } from '@nestjs/testing';
import { HorseRoleDalModule, RoleDalModule, RoleService } from '@nst-caballus/dal';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { RoleController } from './role.controller';

describe('Role Controller Test', () => {
    let controller: RoleController;
    let roleService: RoleService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoleController],
            imports: [
                RoleDalModule,
                HorseRoleDalModule,
                DbModule.forRoot({
                    name: '',
                    type: ConnectionType.MongoDB,
                    ...environment.mongo
                }),
            ],
            providers: [MockDbConnector]
        })
        .overrideProvider(DbConnector).useClass(MockDbConnector)
        .compile();

        controller = module.get<RoleController>(RoleController);
        roleService = module.get<RoleService>(RoleService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
