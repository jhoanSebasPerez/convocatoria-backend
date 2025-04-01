import { Controller, Post, Body, Get, Param, Logger } from "@nestjs/common";
import { EvaluacionesService } from "./evaluaciones.service";
import { EvaluacionDto } from "./dtos/evaluacion.dto";
import { User } from "@prisma/client";
import { Auth } from "src/auth/decorators/auth.decorator";
import { ValidRoles } from "src/auth/types/valid-roles.type";
import { GetUser } from "src/auth/decorators/get-user.decorator";

@Controller("evaluaciones")
export class EvaluacionesController {
    private readonly logger = new Logger(EvaluacionesController.name);

    constructor(private readonly evaluacionesService: EvaluacionesService) { }

    @Post()
    @Auth(ValidRoles.DOCENTE)
    async crearEvaluacion(@Body() dto: EvaluacionDto, @GetUser() evaluador: User) {
        this.logger.log(`Creando evaluación: ${JSON.stringify(dto)}`);
        this.logger.log(`Evaluador: ${JSON.stringify(evaluador)}`);
        console.log("Entro en el controlador de evaluaciones");
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