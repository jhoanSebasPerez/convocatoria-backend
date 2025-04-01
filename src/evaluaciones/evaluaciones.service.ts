import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from "@nestjs/common";
import { User } from "@prisma/client";
import { EvaluacionDto } from "./dtos/evaluacion.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { NotificationService } from "src/notificaciones/notificaciones.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EvaluacionesService {

    private readonly logger = new Logger(EvaluacionesService.name);

    private frontUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificacionService: NotificationService,
        private readonly configService: ConfigService
    ) {
        this.frontUrl = this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    }

    async crearEvaluacion(dto: EvaluacionDto, evaluador: User) {
        // ⚠️ Validar que el usuario sea un docente
        if (!evaluador.roles.includes("DOCENTE")) {
            throw new ForbiddenException("No tienes permisos para evaluar este proyecto.");
        }

        // ✅ Obtener información del proyecto antes de iniciar la transacción
        const proyecto = await this.prisma.proyecto.findUnique({
            where: { id: dto.proyectoId },
            include: { convocatoria: { include: { rubrica: true } }, estudiantes: true },
        });

        if (!proyecto) throw new NotFoundException("El proyecto no existe.");

        if (!proyecto.convocatoria?.rubrica) {
            throw new BadRequestException("No hay una rúbrica asignada para este proyecto.");
        }

        // ✅ Verificar si el proyecto ya fue evaluado antes de la transacción
        const existeEvaluacion = await this.prisma.evaluacion.findUnique({
            where: { proyectoId: dto.proyectoId },
        });

        if (existeEvaluacion) {
            throw new BadRequestException("Este proyecto ya ha sido evaluado.");
        }

        // ✅ Ejecutar solo la inserción dentro de la transacción con timeout aumentado
        const evaluacion = await this.prisma.$transaction(
            async (prisma) => {
                // Insertar la evaluación
                const nuevaEvaluacion = await prisma.evaluacion.create({
                    data: {
                        proyectoId: dto.proyectoId,
                        rubricaId: proyecto?.convocatoria?.rubrica?.id ?? "",
                        puntajeTotal: dto.puntajeTotal,
                        observaciones: dto.observaciones,
                        evaluadorId: evaluador.id,
                    },
                });

                // Insertar los criterios de evaluación
                await prisma.evaluacionCriterio.createMany({
                    data: dto.criteriosEvaluacion.map((criterio) => ({
                        evaluacionId: nuevaEvaluacion.id,
                        criterioId: criterio.criterioId,
                        puntaje: criterio.puntaje,
                        comentario: criterio.comentario ?? null,
                    })),
                });

                return nuevaEvaluacion;
            },
            { timeout: 10000 } // ⏳ Aumentamos el timeout a 10 segundos
        );

        // ✅ Enviar notificaciones fuera de la transacción
        Promise.all([
            ...proyecto.estudiantes.map((estudiante) =>
                this.notificacionService.enviarNotificacion({
                    user: { id: estudiante.id, fullname: estudiante.fullname ?? "", email: estudiante.email },
                    title: proyecto.titulo,
                    message: `Tu proyecto: ${proyecto.titulo} ha sido evaluado.`,
                    actionUrl: `${this.frontUrl}/mis-proyectos/${proyecto.id}`,
                })
            ),
            this.prisma.user
                .findFirst({ where: { roles: { has: "ADMIN" } } })
                .then((admin) => {
                    if (admin) {
                        this.notificacionService.enviarNotificacion({
                            user: { id: admin.id, fullname: admin.fullname ?? "", email: admin.email },
                            title: proyecto.titulo,
                            message: `El proyecto: ${proyecto.titulo} ha sido evaluado por el docente ${evaluador.fullname}.`,
                            actionUrl: `${this.frontUrl}/proyectos/${proyecto.id}`,
                        });
                    }
                }),
        ]);

        return { message: "Evaluación creada correctamente", evaluacionId: evaluacion.id };
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