import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { CreateProyectoDto } from "./dto/create-proyecto.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { User } from "@prisma/client";
import { NotificationService } from "src/notificaciones/notificaciones.service";


@Injectable()
export class ProyectoService {

  private readonly logger = new Logger(ProyectoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacionService: NotificationService
  ) { }

  async createProyecto(dto: CreateProyectoDto, user) {
    this.logger.debug(`Creating new Proyecto: ${JSON.stringify(dto)}`);

    // 🔹 Ejecutar la transacción para la creación del proyecto
    const proyecto = await this.prisma.$transaction(async (prisma) => {
      // ✅ Verificar si la convocatoria existe
      const convocatoriaExists = await prisma.convocatoria.findUnique({
        where: { id: dto.convocatoriaId },
      });

      if (!convocatoriaExists) {
        throw new BadRequestException("La convocatoria especificada no existe.");
      }

      if (dto.proyectoAula && dto.proyectoSemillero) {
        throw new BadRequestException("Un proyecto no puede ser de aula y semillero al mismo tiempo.");
      }

      if (!dto.estudiantes || dto.estudiantes.length === 0) {
        throw new BadRequestException("El proyecto debe tener al menos un estudiante.");
      }

      const proyectoEstudiantes: User[] = [user];

      // ✅ Procesar los estudiantes (crear si no existen)
      const nuevosEstudiantesIds = await Promise.all(
        dto.estudiantes.map(async (estudiante) => {
          let existingEstudiante = await prisma.user.findUnique({
            where: { email: estudiante.email },
          });

          if (!existingEstudiante) {
            return await prisma.user.create({
              data: {
                fullname: estudiante.fullname,
                email: estudiante.email,
                roles: ["ESTUDIANTE"],
                password: bcrypt.hashSync(`${estudiante.fullname}`, 10),
              },
            });
          }
          return existingEstudiante;
        })
      );

      // ✅ Agregar estudiantes al proyecto
      proyectoEstudiantes.push(...nuevosEstudiantesIds);

      // ✅ Crear el Proyecto base
      let proyecto = await prisma.proyecto.create({
        data: {
          titulo: dto.titulo,
          resumen: dto.resumen,
          convocatoriaId: dto.convocatoriaId,
          tiempoEjecucion: dto.tiempoEjecucion,
          fechaInicio: new Date(dto.fechaInicio),
          fechaFin: new Date(dto.fechaFin),
          estudiantes: {
            connect: proyectoEstudiantes.map(({ id }) => ({ id })),
          },
          documentoUrl: dto.documentoUrl,
        },
      });

      let updateData = {}; // Para almacenar el id del proyecto de aula o semillero

      // ✅ Crear Proyecto de Aula si aplica
      if (dto.proyectoAula) {
        const proyectoAula = await prisma.proyectoAula.create({
          data: {
            curso: dto.proyectoAula.curso,
            docenteOrientador: dto.proyectoAula.docenteOrientador,
            estadoFormulacion: dto.proyectoAula.estadoFormulacion,
            estadoEjecucion: dto.proyectoAula.estadoEjecucion,
            estadoTerminado: dto.proyectoAula.estadoTerminado,
            modalidadPresentacion: dto.proyectoAula.modalidadPresentacion,
            proyectoId: proyecto.id,
          },
        });

        updateData = { proyectoAulaId: proyectoAula.id };
      }

      // ✅ Crear Proyecto de Semillero si aplica
      if (dto.proyectoSemillero) {
        const proyectoSemillero = await prisma.proyectoSemillero.create({
          data: {
            nombreSemillero: dto.proyectoSemillero.nombreSemillero,
            siglaSemillero: dto.proyectoSemillero.siglaSemillero,
            directorSemillero: dto.proyectoSemillero.directorSemillero,
            modalidadPresentacion: dto.proyectoSemillero.modalidadPresentacion,
            proyectoId: proyecto.id,
          },
        });

        updateData = { proyectoSemilleroId: proyectoSemillero.id };
      }

      // ✅ Actualizar Proyecto con relación de Aula o Semillero si aplica
      if (Object.keys(updateData).length > 0) {
        proyecto = await prisma.proyecto.update({
          where: { id: proyecto.id },
          data: updateData,
        });
      }

      return { proyecto, estudiantes: proyectoEstudiantes };
    });

    // 🚀 **La transacción ha terminado, ahora enviamos las notificaciones**
    const { proyecto: proyectoCreado, estudiantes: proyectoEstudiantes } = proyecto;

    // ✅ Obtener admin para notificación
    const admin = await this.prisma.user.findFirst({
      where: { roles: { has: "ADMIN" } },
    });

    const notificationes = [
      admin && {
        user: { id: admin.id, fullname: admin.fullname, email: admin.email },
        title: `Nuevo proyecto: ${proyectoCreado.titulo}`,
        message: `Nuevo proyecto creado: ${proyectoCreado.titulo}`,
        actionUrl: `/proyectos/${proyectoCreado.id}`,
      },
      {
        user: { id: user.id, fullname: user.fullname, email: user.email },
        title: `Nuevo proyecto: ${proyectoCreado.titulo}`,
        message: `Tu proyecto: ${proyectoCreado.titulo} ha sido creado.`,
        actionUrl: `/mis-proyectos/${proyectoCreado.id}`,
      },
    ];

    // ✅ Notificar a los estudiantes agregados
    proyectoEstudiantes.filter(e => e.id !== user.id).forEach(estudiante => {
      notificationes.push({
        user: { id: estudiante.id, fullname: estudiante.fullname, email: estudiante.email },
        title: `Nuevo proyecto: ${proyectoCreado.titulo}`,
        message: `Has sido agregado como participante en el proyecto: ${proyectoCreado.titulo}`,
        actionUrl: `/mis-proyectos/${proyectoCreado.id}`,
      });
    });

    this.logger.debug(`Sending notifications: ${JSON.stringify(notificationes)}`);

    // ✅ Enviar notificaciones de manera asíncrona sin afectar el flujo
    Promise.all(
      notificationes
        .filter((notificacion) => notificacion !== null)
        .map((notificacion) =>
          this.notificacionService.enviarNotificacion(notificacion)
        )
    ).catch((err) => {
      this.logger.error("Error enviando notificaciones:", err);
    });

    return proyectoCreado;
  }

  async getProyectoById(id: string, user: User) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: {
        convocatoria: {
          select: {
            id: true,
            titulo: true,
            fechaInicio: true,
            fechaFin: true,
            rubrica: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                criterios: {
                  select: {
                    id: true,
                    nombre: true,
                    descripcion: true,
                    puntajeMin: true,
                    puntajeMax: true,
                  },
                },
              },
            },
          },
        }, // Incluye la información de la convocatoria asociada
        estudiantes: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        }, // Incluye la lista de estudiantes asociados
        proyectoAula: true, // Trae todos los datos de Proyecto Aula si aplica
        proyectoSemillero: true,
        evaluacion: {
          select: { id: true }, // Si tiene un ID, significa que ha sido calificado
        },
      },
    });

    if (!proyecto) {
      throw new NotFoundException(`El proyecto con ID ${id} no fue encontrado.`);
    }

    let evaluador;
    if (user.roles.includes('ADMIN') && proyecto.evaluadorId) {
      evaluador = await this.prisma.user.findUnique({
        where: { id: proyecto.evaluadorId },
      });
    }

    return {
      id: proyecto.id,
      titulo: proyecto.titulo,
      resumen: proyecto.resumen,
      tiempoEjecucion: proyecto.tiempoEjecucion,
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin,
      createdAt: proyecto.createdAt,
      updatedAt: proyecto.updatedAt,
      convocatoria: {
        id: proyecto.convocatoria.id,
        titulo: proyecto.convocatoria.titulo,
        fechaInicio: proyecto.convocatoria.fechaInicio,
        fechaFin: proyecto.convocatoria.fechaFin,
        rubrica: proyecto.convocatoria.rubrica
      },
      estudiantes: proyecto.estudiantes.map(estudiante => ({
        id: estudiante.id,
        fullname: estudiante.fullname,
        email: estudiante.email,
      })),
      tipoProyecto: proyecto.proyectoAula
        ? 'Aula'
        : proyecto.proyectoSemillero
          ? 'Semillero'
          : 'General',
      detallesProyecto: proyecto.proyectoAula || proyecto.proyectoSemillero || null,
      documentoUrl: proyecto.documentoUrl,
      evaluador: {
        id: evaluador?.id || null,
        fullname: evaluador?.fullname || null,
        email: evaluador?.email || null,
      },
      evaluacion: proyecto.evaluacion || null,
    };
  }

  async getAllProyectos() {
    const proyectos = await this.prisma.proyecto.findMany({
      include: {
        convocatoria: {
          select: { id: true, titulo: true }, // Solo obtenemos el nombre y ID de la convocatoria
        },
        proyectoAula: {
          select: { id: true }, // Si tiene un ID, es un Proyecto de Aula
        },
        proyectoSemillero: {
          select: { id: true }, // Si tiene un ID, es un Proyecto de Semillero
        }
      },
    });

    return proyectos.map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      resumen: proyecto.resumen,
      convocatoria: proyecto.convocatoria
        ? proyecto.convocatoria.titulo
        : "Sin convocatoria",
      tipoProyecto: proyecto.proyectoAula
        ? "Aula"
        : proyecto.proyectoSemillero
          ? "Semillero"
          : "General",
      evaluador: proyecto.evaluadorId ? "Asignado" : "Sin asignar",
    }));
  }

  async getProyectosByUser(userId: string) {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        estudiantes: {
          some: { id: userId }, // Solo proyectos en los que el usuario participa
        },
      },
      select: {
        id: true,
        titulo: true,
        convocatoria: {
          select: {
            titulo: true, // Obtiene el título de la convocatoria
          },
        },
        proyectoAula: {
          select: { id: true }, // Si tiene un ID, es un proyecto de aula
        },
        proyectoSemillero: {
          select: { id: true }, // Si tiene un ID, es un proyecto de semillero
        },
        documentoUrl: true, // Si tiene un documento
        evaluacion: {
          select: { id: true }, // Si tiene un ID, significa que ha sido calificado
        },
      },
    });

    // Transformamos los datos para agregar "tipoProyecto", "tieneDocumento" y "haSidoCalificado"
    return proyectos.map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      convocatoria: proyecto.convocatoria.titulo,
      tipoProyecto: proyecto.proyectoAula ? "AULA" : proyecto.proyectoSemillero ? "SEMILLERO" : "SIN DEFINIR",
      tieneDocumento: !!proyecto.documentoUrl,
      haSidoCalificado: !!proyecto.evaluacion,
    }));
  }

  async asignarEvaluador(proyectoId: string, evaluadorId: string) {
    // Verificar que el usuario asignado sea un docente
    const evaluador = await this.prisma.user.findUnique({
      where: { id: evaluadorId },
      select: { roles: true, id: true, fullname: true, email: true },
    });

    if (!evaluador?.roles?.includes("DOCENTE")) {
      throw new BadRequestException("El usuario seleccionado no es un docente válido.");
    }

    // Verificar que el proyecto existe
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
    });

    if (!proyecto) {
      throw new NotFoundException("No se encontró el proyecto.");
    }

    // Asignar el evaluador al proyecto
    await this.prisma.proyecto.update({
      where: { id: proyectoId },
      data: { evaluadorId },
    });

    // enviar notificacion de asignacion al evaluador
    this.logger.debug(`Sending notification to evaluator: ${evaluador.fullname}`);
    this.notificacionService.enviarNotificacion({
      user: { id: evaluador.id, fullname: evaluador.fullname ?? "", email: evaluador.email },
      title: `Proyecto asignado: ${proyecto.titulo}`,
      message: `Has sido asignado como evaluador del proyecto: ${proyecto.titulo}`,
      actionUrl: `/proyectos-por-calificar/${proyecto.id}`,
    });


    return { message: "Evaluador asignado correctamente." };
  }

  async getProyectosSinCalificar(user: User) {
    const isValidUser = user.roles.includes("DOCENTE") || user.roles.includes("ADMIN");

    if (!isValidUser) {
      throw new BadRequestException("No tienes permisos para realizar esta acción.");
    }

    const isDocente = user.roles.includes("DOCENTE");

    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        evaluacion: null, // 📌 Solo proyectos sin evaluación
        ...(isDocente && { evaluadorId: user.id }) // 📌 Solo si es docente, filtrar por su ID
      },
      select: {
        id: true,
        titulo: true,
        convocatoria: {
          select: {
            id: true,
            titulo: true,
          },
        },
        proyectoAula: {
          select: { id: true },
        },
        proyectoSemillero: {
          select: { id: true },
        },
        documentoUrl: true,
      },
    });

    return proyectos.map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      convocatoriaId: proyecto.convocatoria.id,
      convocatoria: proyecto.convocatoria.titulo,
      tipoProyecto: proyecto.proyectoAula ? "AULA" : proyecto.proyectoSemillero ? "SEMILLERO" : "SIN DEFINIR",
      documentoUrl: proyecto.documentoUrl,
    }));
  }

  async getProyectosCalificados(user: User) {
    const isAdmin = user.roles.includes("ADMIN");
    const isDocente = user.roles.includes("DOCENTE");

    if (!isAdmin && !isDocente) {
      throw new BadRequestException("No tienes permisos para realizar esta acción.");
    }

    const whereCondition: any = {
      evaluacion: {
        isNot: null, // Solo proyectos con evaluación
      },
    };

    // 🔹 Si el usuario es docente, filtrar solo los proyectos donde él fue el evaluador
    if (isDocente) {
      whereCondition.evaluacion = {
        isNot: null,
        evaluador: { id: user.id }, // Filtra por relación evaluador
      };
    }

    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        evaluacion: {
          isNot: null, // Solo proyectos con evaluación
        },
        evaluadorId: isDocente ? user.id : undefined, // Filtra por evaluador si es docente
      },
      select: {
        id: true,
        titulo: true,
        convocatoria: {
          select: { titulo: true },
        },
        evaluacion: {
          select: {
            puntajeTotal: true,
            fechaEvaluacion: true,
            evaluador: { select: { id: true, fullname: true, email: true } }, // Relación correcta
          },
        },
      },
    });

    return proyectos.map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      convocatoria: proyecto.convocatoria?.titulo,
      puntajeFinal: proyecto.evaluacion?.puntajeTotal,
      fechaEvaluacion: proyecto.evaluacion?.fechaEvaluacion,
      evaluador: proyecto.evaluacion?.evaluador, // Evaluador como objeto
    }));
  }
}