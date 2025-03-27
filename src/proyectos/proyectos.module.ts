import { Module } from '@nestjs/common';
import { ProyectosController } from './proyectos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProyectoService } from './proyectos.service';
import { AuthModule } from 'src/auth/auth.module';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  controllers: [ProyectosController],
  providers: [ProyectoService],
  imports: [PrismaModule, AuthModule, NotificacionesModule],
  exports: [ProyectoService]
})
export class ProyectosModule { }
