import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { EvaluacionesService } from "./evaluaciones.service";
import { EvaluacionDto } from "./dtos/evaluacion.dto";
import { User } from "@prisma/client";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ValidRoles } from "src/auth/types/valid-roles.type";
import { GetUser } from "src/auth/decorators/get-user.decorator";

@Controller("evaluaciones")
export class EvaluacionesController {
    constructor(private readonly evaluacionesService: EvaluacionesService) { }

    @Post()
    @Auth(ValidRoles.DOCENTE)
    async crearEvaluacion(@Body() dto: EvaluacionDto, @GetUser() evaluador: User) {
        return this.evaluacionesService.crearEvaluacion(dto, evaluador);
    }

    @Get("/proyectos/:idProyecto")
    @Auth(ValidRoles.ADMIN, ValidRoles.DOCENTE, ValidRoles.ESTUDIANTE)
    async obtenerEvaluacionesPorProyecto(
        @Param("idProyecto") idProyecto: string,
        @GetUser() user: User
    ) {
        return this.evaluacionesService.getEvaluacionByProyectoId(idProyecto, user);
    }
}