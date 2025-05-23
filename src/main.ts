import "reflect-metadata";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug', 'verbose'] });
  app.setGlobalPrefix('api');
  app.useLogger(app.get(Logger));

  const isDev = app.get(ConfigService).get('DEV');

  app.enableCors({
    origin: [
      isDev ? "http://localhost:3000" : process.env.FRONTEND_URL,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 8080;
  await app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
bootstrap();
