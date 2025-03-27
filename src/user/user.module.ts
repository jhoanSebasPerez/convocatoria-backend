import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    PrismaModule,
    NotificacionesModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UserService],
})
export class UserModule { }
