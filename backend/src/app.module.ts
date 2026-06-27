import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LibraryModule } from './library/library.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma.module';

@Module({
    imports: [PrismaModule, AuthModule, LibraryModule, UsersModule],
})
export class AppModule { }
