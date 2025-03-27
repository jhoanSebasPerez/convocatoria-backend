import { Module } from '@nestjs/common';
import { ConvocatoriasService } from './convocatorias.service';
import { ConvocatoriasController } from './convocatorias.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ConvocatoriasController],
  providers: [ConvocatoriasService],
  imports: [AuthModule, PrismaModule]
})
export class ConvocatoriasModule { }
