import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { ProyectoService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { ValidRoles } from 'src/auth/types/valid-roles.type';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectoService) { }

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.ESTUDIANTE)
  async createProyecto(
    @Body() dto: CreateProyectoDto,
    @GetUser() user: User
  ) {
    return this.proyectosService.createProyecto(dto, user);
  }

  @Get()
  @Auth(ValidRoles.ADMIN)
  async getProyectos() {
    return this.proyectosService.getAllProyectos();
  }
  @Get('/calificados')
  @Auth(ValidRoles.ADMIN, ValidRoles.DOCENTE)
  async getProyectosCalificados(
    @GetUser() user: User
  ) {
    return this.proyectosService.getProyectosCalificados(user);
  }

  @Get('/mis-proyectos')
  @Auth(ValidRoles.ESTUDIANTE)
  async getProyectosByUser(@GetUser() user: User) {
    return this.proyectosService.getProyectosByUser(user.id);
  }

  @Get('/proyectos-por-calificar')
  @Auth(ValidRoles.ADMIN, ValidRoles.DOCENTE)
  async getProyectosPorCalificar(
    @GetUser() user: User
  ) {
    return this.proyectosService.getProyectosSinCalificar(user);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.ESTUDIANTE, ValidRoles.DOCENTE)
  async getProyectoById(
    @Param('id') id: string,
    @GetUser() user: User
  ) {
    return this.proyectosService.getProyectoById(id, user);
  }

  @Post(':id/asignar-evaluador/:evaluadorId')
  @Auth(ValidRoles.ADMIN)
  async asignarEvaluador(
    @Param('id') id: string,
    @Param('evaluadorId') evaluadorId: string
  ) {
    return this.proyectosService.asignarEvaluador(id, evaluadorId);
  }
}
