import { Module } from '@nestjs/common';
import { RubricasService } from './rubricas.service';
import { RubricasController } from './rubricas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [RubricasController],
  providers: [RubricasService],
  imports: [PrismaModule, AuthModule],
})
export class RubricasModule { }
