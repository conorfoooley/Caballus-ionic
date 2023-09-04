import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StripeService } from './stripe.service';
import { BranchService } from './branch.service';

@Module({
    imports: [HttpModule],
    providers: [StripeService, BranchService],
    exports: [StripeService, BranchService]
})
export class ServicesModule {
}
