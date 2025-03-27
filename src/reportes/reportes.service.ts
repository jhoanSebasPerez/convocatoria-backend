import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportesService {
    constructor(private readonly prisma: PrismaService) { }

    async getProyectosPorConvocatoria() {
        const convocatorias = await this.prisma.convocatoria.findMany({
            select: {
                titulo: true,
                _count: { select: { proyectos: true } },
            },
        });

        let filteredData: any = [];

        for (const convocatoria of convocatorias) {
            if (convocatoria._count.proyectos > 0) {
                filteredData.push({
                    name: convocatoria.titulo,
                    value: convocatoria._count.proyectos,
                });
            }
        }

        return filteredData;
    }

    async obtenerEstadoEvaluaciones() {
        const totalProyectos = await this.prisma.proyecto.count();
        const proyectosCalificados = await this.prisma.proyecto.count({
            where: { evaluacion: { isNot: null } },
        });

        return {
            calificados: proyectosCalificados,
            noCalificados: totalProyectos - proyectosCalificados,
        };
    }

    async obtenerEstadisticasCantidad() {
        const usuarios = await this.prisma.user.count();
        const convocatorias = await this.prisma.convocatoria.count();
        const proyectos = await this.prisma.proyecto.count();

        return {
            usuarios,
            convocatorias,
            proyectos,
        };
    }

    async getProyectosPorTipo() {
        const proyectosAula = await this.prisma.proyectoAula.count();
        const proyectosSemillero = await this.prisma.proyectoSemillero.count();

        return {
            proyectosAula,
            proyectosSemillero,
        };
    }

    async getPromedioEvaluaciones() {
        return this.prisma.convocatoria.findMany({
            select: {
                titulo: true,
                proyectos: {
                    select: {
                        evaluacion: {
                            select: { puntajeTotal: true },
                        },
                    },
                },
            },
        });
    }
}