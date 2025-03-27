import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
    imports: [
        ConfigModule,
        PrismaModule
    ],
    controllers: [ReportesController],
    providers: [ReportesService],
    exports: [ReportesService]
})
export class ReportesModule { }
