import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RubricasService } from './rubricas.service';
import { CreateRubricaDto } from './dto/create-rubrica.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/types/valid-roles.type';

@Controller('rubricas')
export class RubricasController {
  constructor(private readonly rubricasService: RubricasService) { }

  @Post()
  @Auth(ValidRoles.ADMIN)
  async create(@Body() createRubricaDto: CreateRubricaDto) {
    return this.rubricasService.createRubrica(createRubricaDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN)
  async getRubricas(@Query("search") search?: string) {
    return this.rubricasService.getFilteredRubricas(search);
  }

  @Get(":id")
  @Auth(ValidRoles.ADMIN)
  async getRubrica(@Query("id") id: string) {
    return this.rubricasService.getRubricaById(id);
  }
}