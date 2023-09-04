import { Test, TestingModule } from '@nestjs/testing';
import { environment } from '@nst-caballus/env';
import { ConnectionType, DbConnector, DbModule } from '@rfx/nst-db';
import { HorseEvaluationController } from './evaluation.controller';
import { MockDbConnector } from '../../unit-test-helpers/mock-db/mock-db-connector';
import { FileService } from '@rfx/nst-file'
import { MockFileService } from '../../unit-test-helpers/mock-services/mock-file-service';
import { HorseEvaluationDalModule } from '../../dal/horse-evaluation-dal/horse-evaluation-dal.module';

describe('Horse Evaluation Controller Test', () => {
    let controller: HorseEvaluationController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HorseEvaluationController],
            imports: [
                HorseEvaluationDalModule,
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

        controller = module.get<HorseEvaluationController>(HorseEvaluationController);
    });

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

