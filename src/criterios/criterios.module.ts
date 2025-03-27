import { Module } from '@nestjs/common';
import { CriteriosService } from './criterios.service';
import { CriteriosController } from './criterios.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CriteriosController],
  providers: [CriteriosService],
  imports: [AuthModule, PrismaModule],
})
export class CriteriosModule { }
