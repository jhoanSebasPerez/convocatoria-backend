import { Controller, Get, Query } from '@nestjs/common';
import { CriteriosService } from './criterios.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/types/valid-roles.type';

@Controller('criterios')
export class CriteriosController {
  constructor(private readonly criteriosService: CriteriosService) { }

  @Get()
  @Auth(ValidRoles.ADMIN)
  async findBySearch(@Query('search') search: string) {
    return await this.criteriosService.buscarCriterios(search);
  }
}
