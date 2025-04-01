import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConvocatoriasModule } from './convocatorias/convocatorias.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { SearchModule } from './search/search.module';
import { RubricasModule } from './rubricas/rubricas.module';
import { CriteriosModule } from './criterios/criterios.module';
import { UploadModule } from './upload/upload.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { ReportesModule } from './reportes/reportes.module';
import { HealthController } from './health.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(
      {
        isGlobal: true,
        envFilePath: ".env"
      }
    ),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            transport: isProduction
              ? undefined
              : {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              },
            level: isProduction ? 'info' : 'debug',
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    ConvocatoriasModule,
    ProyectosModule,
    SearchModule,
    RubricasModule,
    CriteriosModule,
    UploadModule,
    EvaluacionesModule,
    NotificacionesModule,
    ReportesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}