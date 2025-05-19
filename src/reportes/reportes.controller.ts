import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    @Get('proyectos-por-convocatoria')
    getProyectosPorConvocatoria() {
        return this.reportesService.getProyectosPorConvocatoria();
    }

    @Get('promedio-evaluaciones')
    getPromedioEvaluaciones() {
        return this.reportesService.getPromedioEvaluaciones();
    }

    @Get('estadisticas-cantidad')
    getestadisticasCantidad() {
        return this.reportesService.obtenerEstadisticasCantidad();
    }

    @Get("estado-evaluaciones")
    async obtenerEstadoEvaluaciones() {
        return this.reportesService.obtenerEstadoEvaluaciones();
    }

    @Get('proyectos-tipo')
    getProyectosPorTipo() {
        return this.reportesService.getProyectosPorTipo();
    }

    @Post('generar-pdf')
    async generarReportePDF(@Body() datos: { fechaInicio: string; fechaFin: string }, @Res() res) {
        // Crear las fechas con formato YYYY-MM-DD para evitar problemas de zona horaria
        console.log("Fecha inicio: ", datos.fechaInicio);
        console.log("Fecha fin: ", datos.fechaFin);

        // Extraer componentes de la fecha de inicio y crear una nueva fecha con la hora local 00:00:00
        const [anioInicio, mesInicio, diaInicio] = datos.fechaInicio.split('-').map(Number);
        const fechaInicioLocal = new Date(anioInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0); // Mes es 0-based en JS

        // Extraer componentes de la fecha de fin y crear con hora actual
        const [anioFin, mesFin, diaFin] = datos.fechaFin.split('-').map(Number);
        const fechaFinLocal = new Date(anioFin, mesFin - 1, diaFin,
            23, 59, 59, 0);

        // Formatear fechas en formato ISO para que incluyan la información correcta de zona horaria
        const fechaInicioISO = fechaInicioLocal.toISOString();
        const fechaFinISO = fechaFinLocal.toISOString();

        console.log("Fecha inicio ajustada: ", fechaInicioLocal);
        console.log("Fecha fin ajustada: ", fechaFinLocal);

        const buffer = await this.reportesService.generarReportePDF(fechaInicioISO, fechaFinISO);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=reporte.pdf',
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Get('proyectos-por-fecha')
    async getProyectosPorFecha(@Query('fechaInicio') fechaInicio: string, @Query('fechaFin') fechaFin: string) {
        return this.reportesService.getProyectosPorFecha(fechaInicio, fechaFin);
    }
}