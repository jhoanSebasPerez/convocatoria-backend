import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRubricaDto } from './dto/create-rubrica.dto';
import { capitalizeSentence } from 'src/utils/string-utils';

@Injectable()
export class RubricasService {
  constructor(private readonly prisma: PrismaService) { }

  async createRubrica(createRubricaDto: CreateRubricaDto) {
    const { nombre, descripcion, criterios, convocatoriaId } = createRubricaDto;

    const nombreUpper = nombre.toUpperCase(); // Convertir el nombre a mayúsculas

    // 1️⃣ Verificar si ya existe una rúbrica con el mismo nombre
    const existingRubrica = await this.prisma.rubrica.findUnique({
      where: { nombre: nombreUpper }
    });

    if (existingRubrica) {
      throw new ConflictException(`La rúbrica "${nombre}" ya existe.`);
    }

    // 2️⃣ Verificar si la convocatoria existe (si se proporciona)
    let convocatoria;
    if (convocatoriaId) {
      convocatoria = await this.prisma.convocatoria.findUnique({
        where: { id: convocatoriaId },
      });

      if (!convocatoria) {
        throw new NotFoundException(`La convocatoria con ID ${convocatoriaId} no fue encontrada.`);
      }
    }

    // 3️⃣ Crear la rúbrica sin los criterios aún
    const nuevaRubrica = await this.prisma.rubrica.create({
      data: {
        nombre: nombreUpper,
        descripcion,
        convocatorias: convocatoria ? { connect: { id: convocatoriaId } } : undefined,
      }
    });

    // 4️⃣ Procesar los criterios
    const criteriosConectados = await Promise.all(
      criterios.map(async (criterio) => {
        const criterioNombreUpper = criterio.nombre.toUpperCase();

        // Buscar si el criterio ya existe
        let criterioExistente = await this.prisma.criterio.findUnique({
          where: { nombre: criterioNombreUpper }
        });

        // Si el criterio no existe, lo creamos
        if (!criterioExistente) {
          criterioExistente = await this.prisma.criterio.create({
            data: {
              nombre: criterioNombreUpper,
              puntajeMin: criterio.puntajeMin,
              puntajeMax: criterio.puntajeMax,
              descripcion: criterio.descripcion
            }
          });
        }

        // Retornar el ID del criterio para conectarlo a la rúbrica
        return { id: criterioExistente.id };
      })
    );

    // 5️⃣ Conectar los criterios a la rúbrica
    await this.prisma.rubrica.update({
      where: { id: nuevaRubrica.id },
      data: {
        criterios: { connect: criteriosConectados }
      }
    });

    // 6️⃣ Retornar la rúbrica con sus criterios asignados
    return this.prisma.rubrica.findUnique({
      where: { id: nuevaRubrica.id },
      include: { criterios: true }
    });
  }

  async getFilteredRubricas(search?: string) {
    const rubricas = await this.prisma.rubrica.findMany({
      where: search
        ? {
          nombre: {
            contains: search,
            mode: "insensitive", // 🔹 No distingue entre mayúsculas y minúsculas
          },
        }
        : {},
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        criterios: {
          select: {
            id: true,
            nombre: true,
            puntajeMax: true,
            puntajeMin: true,
            descripcion: true,
          },
        }
      },
    });

    return rubricas.map((rubrica) => ({
      ...rubrica,
      nombre: capitalizeSentence(rubrica.nombre), // Convierte a Title Case
      criterios: rubrica.criterios.map((criterio) => ({
        ...criterio,
        nombre: capitalizeSentence(criterio.nombre), // Convierte a Title Case
      })),
    }));
  }

  async getRubricaById(id: string) {
    return this.prisma.rubrica.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        criterios: {
          select: {
            id: true,
            nombre: true,
            puntajeMax: true,
            puntajeMin: true,
            descripcion: true,
          },
        }
      },
    });
  }
}