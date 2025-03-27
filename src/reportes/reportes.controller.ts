import { Controller, Get } from '@nestjs/common';
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
}