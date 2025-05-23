import { Module } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { EvaluacionesController } from './evaluaciones.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [PrismaModule, NotificacionesModule, AuthModule],
    exports: [EvaluacionesService],
    providers: [EvaluacionesService],
    controllers: [EvaluacionesController]
})
export class EvaluacionesModule { }
