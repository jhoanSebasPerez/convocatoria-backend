import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import { EvaluacionDto } from "./dtos/evaluacion.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { NotificationService } from "src/notificaciones/notificaciones.service";

@Injectable()
export class EvaluacionesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificacionService: NotificationService
    ) { }

    async crearEvaluacion(dto: EvaluacionDto, evaluador: User) {
        // ⚠️ Validar que el usuario sea un docente
        if (!evaluador.roles.includes("DOCENTE")) {
            throw new ForbiddenException("No tienes permisos para evaluar este proyecto.");
        }

        return this.prisma.$transaction(async (prisma) => {
            // ✅ Verificar que el proyecto existe
            const proyecto = await prisma.proyecto.findUnique({
                where: { id: dto.proyectoId },
                include: { convocatoria: { include: { rubrica: true } }, estudiantes: true },
            });

            if (!proyecto) throw new NotFoundException("El proyecto no existe.");

            // ✅ Verificar que el proyecto aún no ha sido evaluado
            const existeEvaluacion = await prisma.evaluacion.findUnique({
                where: { proyectoId: dto.proyectoId },
            });

            if (existeEvaluacion) {
                throw new BadRequestException("Este proyecto ya ha sido evaluado.");
            }

            // ✅ Verificar que la rúbrica del proyecto exista
            if (!proyecto.convocatoria?.rubrica) {
                throw new BadRequestException("No hay una rúbrica asignada para este proyecto.");
            }

            // Insertar la evaluación
            const evaluacion = await prisma.evaluacion.create({
                data: {
                    proyectoId: dto.proyectoId,
                    rubricaId: proyecto.convocatoria.rubrica.id,
                    puntajeTotal: dto.puntajeTotal,
                    observaciones: dto.observaciones,
                    evaluadorId: evaluador.id,
                },
            });

            // Insertar los criterios de evaluación
            await prisma.evaluacionCriterio.createMany({
                data: dto.criteriosEvaluacion.map((criterio) => ({
                    evaluacionId: evaluacion.id,
                    criterioId: criterio.criterioId,
                    puntaje: criterio.puntaje,
                    comentario: criterio.comentario ?? null,
                })),
            });

            // Enviar notificación a los estudiantes
            Promise.all(
                proyecto.estudiantes.map((estudiante) =>
                    this.notificacionService.enviarNotificacion({
                        user: { id: estudiante.id, fullname: estudiante.fullname ?? "", email: estudiante.email },
                        title: proyecto.titulo,
                        message: `Tu proyecto: ${proyecto.titulo} ha sido evaluado.`,
                        actionUrl: `/proyectos/${proyecto.id}`,
                    })
                )
            );

            //Enviar notificacion al administrador
            const admin = await prisma.user.findFirst({
                where: { roles: { has: "ADMIN" } },
            });

            if (admin) {
                this.notificacionService.enviarNotificacion({
                    user: { id: admin.id, fullname: admin.fullname ?? "", email: admin.email },
                    title: proyecto.titulo,
                    message: `El proyecto: ${proyecto.titulo} ha sido
                    evaluado por el docente ${evaluador.fullname}.`,
                    actionUrl: `/proyectos/${proyecto.id}`,
                });
            }
            return { message: "Evaluación creada correctamente", evaluacionId: evaluacion.id };
        });
    }

    async getEvaluacionByProyectoId(proyectoId: string, user: User) {
        const isAdmin = user.roles.includes("ADMIN");

        const proyecto = await this.prisma.proyecto.findUnique({
            where: { id: proyectoId },
            select: {
                estudiantes: true,
                evaluadorId: true,
            }
        });

        if (!proyecto) {
            throw new NotFoundException("El proyecto no existe.");
        }

        if (!isAdmin && proyecto?.evaluadorId !== user.id && proyecto.estudiantes.every(e => e.id !== user.id)) {
            throw new ForbiddenException("No tienes permisos para ver esta evaluación.");
        }

        const evaluacion = await this.prisma.evaluacion.findFirst({
            where: { proyectoId },
            include: {
                criteriosEvaluacion: { include: { criterio: true } },
                rubrica: true,
            },
        });

        return evaluacion;
    }
}