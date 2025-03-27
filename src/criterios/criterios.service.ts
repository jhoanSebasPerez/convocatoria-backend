import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { capitalizeSentence } from 'src/utils/string-utils';

@Injectable()
export class CriteriosService {

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  async buscarCriterios(nombre: string) {
    const criterios = await this.prismaService.criterio.findMany({
      where: {
        nombre: {
          contains: nombre, // Filtra los que contienen la palabra clave
          mode: 'insensitive', // Ignora mayúsculas y minúsculas
        },
      },
      orderBy: { nombre: 'asc' }, // Ordena alfabéticamente
    });

    return criterios.map((criterio) => ({
      ...criterio,
      nombre: capitalizeSentence(criterio.nombre), // Devuelve con formato de oración
    }));
  }

}
