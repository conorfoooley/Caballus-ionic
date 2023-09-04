import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { TokenRepository } from './token.repository';
import { ServicesModule } from '@nst-caballus/library';

@Module({
    imports: [
        ServicesModule
    ],
    providers: [AuthService, AuthRepository, TokenRepository],
    exports: [AuthService]
})
export class AuthDalModule {}
