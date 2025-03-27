import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConvocatoriaDto } from './dto/create-convocatoria.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConvocatoriasService {

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  create(createConvocatoriaDto: CreateConvocatoriaDto) {
    const { rubricaId } = createConvocatoriaDto;

    if (rubricaId) {
      this.prismaService.rubrica.findUniqueOrThrow({
        where: { id: rubricaId }
      }).catch(() => {
        throw new NotFoundException(`Rubrica with id ${rubricaId} not found`);
      }
      );
    }

    return this.prismaService.convocatoria.create({
      data: createConvocatoriaDto
    });
  }

  async getAvailableConvocatorias(userId: string) {
    try {
      const convocatorias = await this.prismaService.convocatoria.findMany({
        where: {
          isActive: true, // Solo convocatorias activas
          proyectos: {
            every: { // Asegura que en cada proyecto, el usuario NO esté presente
              estudiantes: {
                none: {
                  id: userId,
                },
              },
            },
          },
        },
        include: {
          proyectos: {
            select: {
              id: true,
            },
          },
        },
      });

      return convocatorias;
    } catch (error) {
      console.error("Error al obtener convocatorias disponibles:", error);
      throw new Error("No se pudo obtener las convocatorias disponibles.");
    }
  }

  async findAll() {
    return this.prismaService.convocatoria.findMany();
  }

  async findById(id: string) {
    const convocatoria = await this.prismaService.convocatoria.findUnique({
      where: { id },
      include: {
        proyectos: {
          select: {
            id: true,
            titulo: true,
            resumen: true,
            tiempoEjecucion: true,
            fechaInicio: true,
            fechaFin: true,
            proyectoAula: { select: { id: true } },
            proyectoSemillero: { select: { id: true } },
          },
        },
        rubrica: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            criterios: {
              select: {
                id: true,
                descripcion: true,
                nombre: true,
                puntajeMax: true,
                puntajeMin: true,
              },
            },
          },
        },
      },
    });

    if (!convocatoria) {
      throw new NotFoundException(`Convocatoria with id ${id} not found`);
    }

    // Agregar un campo `tipoProyecto` basado en la existencia de las relaciones
    const proyectos = convocatoria.proyectos.map((proyecto) => {
      return {
        ...proyecto,
        tipoProyecto: proyecto.proyectoAula ? "Aula" : proyecto.proyectoSemillero ? "Semillero" : "General",
      }
    });


    return { ...convocatoria, proyectos };
  }
}
