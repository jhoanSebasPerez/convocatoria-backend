import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) { }

  async search(query: string) {
    if (!query) return [];

    // 🔹 Buscar Convocatorias por título
    const convocatorias = await this.prisma.convocatoria.findMany({
      where: {
        titulo: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        titulo: true,
        fechaInicio: true,
        fechaFin: true,
      },
    });

    const convocatoriasFormatted = convocatorias.map((convocatoria) => ({
      id: convocatoria.id,
      titulo: convocatoria.titulo,
      tipo: "Convocatoria",
      fechaInicio: convocatoria.fechaInicio,
      fechaFin: convocatoria.fechaFin,
    }));

    // 🔹 Buscar Proyectos por título
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        titulo: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        titulo: true,
        resumen: true,
        convocatoria: {
          select: { id: true, titulo: true },
        },
        proyectoAula: { select: { id: true } },
        proyectoSemillero: { select: { id: true } },
        fechaInicio: true,
        fechaFin: true,
      },
    });

    // 🔹 Agregar el tipo de proyecto (Aula, Semillero o General)
    const formattedProjects = proyectos.map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      resumen: proyecto.resumen,
      tipo: "Proyecto",
      convocatoria: proyecto.convocatoria ? proyecto.convocatoria.titulo : "Sin convocatoria",
      tipoProyecto: proyecto.proyectoAula
        ? "Aula"
        : proyecto.proyectoSemillero
          ? "Semillero"
          : "General",
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin,
    }));

    return [...convocatoriasFormatted, ...formattedProjects];
  }
}
