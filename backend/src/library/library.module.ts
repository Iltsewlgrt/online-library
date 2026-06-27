import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { OpenLibraryService } from './open-library.service';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [PrismaModule, PassportModule],
    controllers: [LibraryController],
    providers: [LibraryService, OpenLibraryService],
})
export class LibraryModule { }
