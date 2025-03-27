import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ConvocatoriasService } from './convocatorias.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/types/valid-roles.type';
import { CreateConvocatoriaDto } from './dto/create-convocatoria.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('convocatorias')
export class ConvocatoriasController {
  constructor(private readonly convocatoriasService: ConvocatoriasService) { }

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createConvocatoriaDto: CreateConvocatoriaDto) {
    return this.convocatoriasService.create(createConvocatoriaDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN)
  findAll() {
    return this.convocatoriasService.findAll();
  }

  @Get("/availables")
  @Auth(ValidRoles.ESTUDIANTE)
  getAvailableConvocatoriasForStudent(
    @GetUser() user: User
  ) {
    return this.convocatoriasService.getAvailableConvocatorias(user.id);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.ESTUDIANTE)
  findById(@Param("id") id: string) {
    return this.convocatoriasService.findById(id);
  }
}
