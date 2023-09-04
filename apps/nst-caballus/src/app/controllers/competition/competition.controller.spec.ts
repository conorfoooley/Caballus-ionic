import { Test, TestingModule } from '@nestjs/testing';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { HorseCompetitionController } from './competition.controller';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { FileService } from '@rfx/nst-file'
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import { HorseCompetitionDalModule } from '../../dal/horse-competition-dal/horse-competition-dal.module';

describe('Horse Competition Controller Test', () => {
    let controller: HorseCompetitionController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HorseCompetitionController],
            imports: [
                HorseCompetitionDalModule,
                DbModule.forRoot({
                    name: '',
                    type: ConnectionType.MongoDB,
                    ...environment.mongo
                })
            ],
            providers: [MockDbConnector]
        })
            .overrideProvider(DbConnector).useClass(MockDbConnector)
            .overrideProvider(FileService).useValue(MockFileService)
            .compile();

        controller = module.get<HorseCompetitionController>(HorseCompetitionController);
    });

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

