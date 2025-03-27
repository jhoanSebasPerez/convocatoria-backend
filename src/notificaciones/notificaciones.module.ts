import { Module } from '@nestjs/common';
import { NotificationService } from './notificaciones.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
    ],
    exports: [NotificationService],
    providers: [NotificationService],
})
export class NotificacionesModule { }
