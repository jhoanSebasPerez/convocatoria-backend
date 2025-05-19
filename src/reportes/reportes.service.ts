import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

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

    async obtenerEstadoEvaluaciones(fechaInicio?: string, fechaFin?: string) {
        const filtroFecha = fechaInicio && fechaFin ? {
            createdAt: {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin),
            }
        } : {};

        const totalProyectos = await this.prisma.proyecto.count({
            where: filtroFecha
        });

        const proyectosCalificados = await this.prisma.proyecto.count({
            where: {
                ...filtroFecha,
                evaluacion: { isNot: null }
            },
        });

        return {
            calificados: proyectosCalificados,
            noCalificados: totalProyectos - proyectosCalificados,
        };
    }

    async obtenerEstadisticasCantidad(fechaInicio?: string, fechaFin?: string) {
        const filtroFecha = fechaInicio && fechaFin ? {
            createdAt: {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin),
            }
        } : {};

        const usuarios = await this.prisma.user.count({
            where: filtroFecha
        });

        const convocatorias = await this.prisma.convocatoria.count({
            where: filtroFecha
        });

        const proyectos = await this.prisma.proyecto.count({
            where: filtroFecha
        });

        return {
            usuarios,
            convocatorias,
            proyectos,
        };
    }

    async getProyectosPorTipo(fechaInicio?: string, fechaFin?: string) {
        // Para tipos de proyectos necesitamos filtrar a través de la relación con proyectos
        let proyectosAula;
        let proyectosSemillero;

        if (fechaInicio && fechaFin) {
            // Buscar los proyectos creados en el período
            const proyectos = await this.prisma.proyecto.findMany({
                where: {
                    createdAt: {
                        gte: new Date(fechaInicio),
                        lte: new Date(fechaFin),
                    }
                },
                include: {
                    proyectoAula: true,
                    proyectoSemillero: true
                }
            });

            // Contar los tipos de proyectos
            proyectosAula = proyectos.filter(p => p.proyectoAula).length;
            proyectosSemillero = proyectos.filter(p => p.proyectoSemillero).length;
        } else {
            proyectosAula = await this.prisma.proyectoAula.count();
            proyectosSemillero = await this.prisma.proyectoSemillero.count();
        }

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

    async getConvocatoriasPorFecha(fechaInicio: string, fechaFin: string) {
        return this.prisma.convocatoria.findMany({
            where: {
                createdAt: {
                    gte: new Date(fechaInicio),
                    lte: new Date(fechaFin),
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async getProyectosPorFecha(fechaInicio: string, fechaFin: string) {
        // Obtener TODOS los proyectos dentro del rango de fechas
        return this.prisma.proyecto.findMany({
            where: {
                createdAt: {
                    gte: new Date(fechaInicio),
                    lte: new Date(fechaFin),
                },
            },
            include: {
                convocatoria: {
                    select: { titulo: true },
                },
                evaluacion: {
                    select: { puntajeTotal: true },
                },
                proyectoSemillero: true,
                proyectoAula: true,
            },
            orderBy: {
                createdAt: 'desc', // Ordenar por fecha de creación (del más reciente al más antiguo)
            },
        });
    }

    async generarReportePDF(fechaInicio: string, fechaFin: string): Promise<Buffer> {
        // Formatear fechas para el log con zona horaria local
        const formatoFecha = (fechaISO: string) => {
            // Convertir la fecha ISO directamente a la zona horaria local para visualización
            try {
                // Manejar correctamente la fecha para visualización en la zona horaria local
                const date = new Date(fechaISO);

                return date.toLocaleString('es-CO', {
                    timeZone: 'America/Bogota',
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                });
            } catch (error) {
                console.error('Error al formatear fecha:', error);
                return fechaISO; // Devolver la fecha original si hay error
            }
        };

        console.log(`Generando reporte PDF para el período: ${formatoFecha(fechaInicio)} hasta ${formatoFecha(fechaFin)}`);

        // Obtener los datos para el reporte (filtrados por fecha)
        const proyectos = await this.getProyectosPorFecha(fechaInicio, fechaFin);
        console.log(`Total de proyectos encontrados en el período: ${proyectos.length}`);
        const convocatorias = await this.getConvocatoriasPorFecha(fechaInicio, fechaFin);
        const estadisticas = await this.obtenerEstadisticasCantidad(fechaInicio, fechaFin);
        const estadoEvaluaciones = await this.obtenerEstadoEvaluaciones(fechaInicio, fechaFin);
        const proyectosPorTipo = await this.getProyectosPorTipo(fechaInicio, fechaFin);

        // Definir colores para el diseño ejecutivo (con esquema rojo #dd4b39)
        const colores = {
            primario: '#dd4b39', // Color principal: rojo
            secundario: '#f5f5f5', // Gris claro para fondos
            acento: '#ff8a65', // Naranja para acentos
            texto: '#333333', // Gris oscuro para texto
            tablaEncabezado: '#ffebee', // Rojo muy claro para encabezados de tabla
            tablaBorde: '#ef9a9a', // Rojo medio para bordes
            tablaFilaAlt: '#fff5f5', // Rojo muy pálido para filas alternas
            exitoso: '#4caf50', // Verde para indicadores positivos
            advertencia: '#ff9800', // Naranja para indicadores de advertencia
        };

        // Crear el documento PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: 'Reporte Ejecutivo de Proyectos',
                Author: 'Sistema de Gestión de Convocatorias',
                Subject: `Reporte del ${fechaInicio} al ${fechaFin}`,
            }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        const promesa = new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
        });

        // Obtener ancho útil de la página (descontando márgenes)
        const pageWidth = doc.page.width - 100; // 50px de margen a cada lado

        // Cabecera con estilo
        doc.rect(0, 0, doc.page.width, 120).fill(colores.primario);
        doc.fill('white');
        doc.fontSize(28).text('Reporte Ejecutivo de Proyectos', 50, 50, { align: 'center' });
        doc.fontSize(14).text(`Período: ${fechaInicio.split('T')[0]} al ${fechaFin.split('T')[0]}`, { align: 'center' });
        doc.fontSize(12).text('Datos filtrados por fecha de creación', { align: 'center' });
        doc.moveDown(3);

        // Estilo para títulos de sección - alineados a la izquierda
        const tituloSeccion = (texto: string) => {
            doc.fillColor(colores.primario)
                .fontSize(16)
                .text(texto, 50, doc.y, { underline: false, align: 'left' })
                .moveDown(0.5);
            doc.rect(50, doc.y - 5, pageWidth, 2)
                .fill(colores.primario);
            doc.fillColor(colores.texto)
                .moveDown(0.5);
        };

        // Sección: Resumen ejecutivo
        tituloSeccion('Resumen Ejecutivo');

        // Cuadros de estadísticas con mejor diseño visual
        const boxWidth = pageWidth / 3 - 15;
        const boxHeight = 60;
        const boxY = doc.y;

        // Cuadro 1: Total de Proyectos
        doc.rect(50, boxY, boxWidth, boxHeight).fillAndStroke(colores.secundario, colores.tablaBorde);
        doc.fillColor(colores.texto).fontSize(10).text('PROYECTOS CREADOS', 50 + 10, boxY + 10);
        doc.fillColor(colores.primario).fontSize(22).text(estadisticas.proyectos.toString(), 50 + 10, boxY + 25);

        // Cuadro 2: Convocatorias
        doc.rect(50 + boxWidth + 15, boxY, boxWidth, boxHeight).fillAndStroke(colores.secundario, colores.tablaBorde);
        doc.fillColor(colores.texto).fontSize(10).text('CONVOCATORIAS CREADAS', 50 + boxWidth + 25, boxY + 10);
        doc.fillColor(colores.primario).fontSize(22).text(estadisticas.convocatorias.toString(), 50 + boxWidth + 25, boxY + 25);

        // Cuadro 3: Usuarios
        doc.rect(50 + (boxWidth + 15) * 2, boxY, boxWidth, boxHeight).fillAndStroke(colores.secundario, colores.tablaBorde);
        doc.fillColor(colores.texto).fontSize(10).text('USUARIOS NUEVOS', 50 + (boxWidth + 15) * 2 + 10, boxY + 10);
        doc.fillColor(colores.primario).fontSize(22).text(estadisticas.usuarios.toString(), 50 + (boxWidth + 15) * 2 + 10, boxY + 25);

        doc.moveDown(4);

        // Sección: Convocatorias creadas en el período
        tituloSeccion(`Convocatorias Creadas (${convocatorias.length})`);

        if (convocatorias.length === 0) {
            doc.fillColor(colores.texto).fontSize(12).text('No se encontraron convocatorias creadas en el período seleccionado.');
            doc.moveDown(1);
        } else {
            // Mostrar listado de convocatorias
            let convocatoriasY = doc.y;

            // Encabezado de la tabla
            doc.rect(50, convocatoriasY - 5, pageWidth, 25)
                .fill(colores.tablaEncabezado);

            doc.fillColor(colores.primario).fontSize(10).font('Helvetica-Bold');
            doc.text('TÍTULO', 55, convocatoriasY + 5);
            doc.text('FECHA DE CREACIÓN', 55 + pageWidth - 150, convocatoriasY + 5);
            doc.font('Helvetica').fillColor(colores.texto);

            convocatoriasY += 25;
            let colorAlternado = false;

            for (const convocatoria of convocatorias) {
                // Alternar colores de fondo para las filas
                if (colorAlternado) {
                    doc.rect(50, convocatoriasY - 5, pageWidth, 20)
                        .fill(colores.tablaFilaAlt);
                }
                colorAlternado = !colorAlternado;

                const titulo = convocatoria.titulo.length > 65 ?
                    `${convocatoria.titulo.substring(0, 62)}...` : convocatoria.titulo;

                const fecha = convocatoria.createdAt.toLocaleDateString();

                doc.fontSize(9);
                doc.text(titulo, 55, convocatoriasY);
                doc.text(fecha, 55 + pageWidth - 150, convocatoriasY);

                convocatoriasY += 20;

                // Nueva página si no hay espacio
                if (convocatoriasY > 700 && convocatorias.indexOf(convocatoria) < convocatorias.length - 1) {
                    doc.addPage();
                    convocatoriasY = 50;

                    // Repetir encabezado
                    doc.rect(50, convocatoriasY - 5, pageWidth, 25)
                        .fill(colores.tablaEncabezado);

                    doc.fillColor(colores.primario).fontSize(10).font('Helvetica-Bold');
                    doc.text('TÍTULO', 55, convocatoriasY + 5);
                    doc.text('FECHA DE CREACIÓN', 55 + pageWidth - 150, convocatoriasY + 5);
                    doc.font('Helvetica').fillColor(colores.texto);

                    convocatoriasY += 25;
                    colorAlternado = false;
                }
            }

            // Borde exterior de la tabla
            doc.rect(50, doc.y - (convocatorias.length) * 20 - 25, pageWidth, (convocatorias.length) * 20 + 25)
                .stroke(colores.tablaBorde);

            doc.moveDown(2);
        }

        // Sección: Estado de Evaluaciones
        tituloSeccion('Estado de Proyectos');

        // Gráfico de barras simplificado para estado de evaluaciones
        const barHeight = 25;
        const barMaxWidth = pageWidth - 150;
        const total = estadoEvaluaciones.calificados + estadoEvaluaciones.noCalificados;
        const barWidth1 = total > 0 ? (estadoEvaluaciones.calificados / total) * barMaxWidth : 0;
        const barWidth2 = total > 0 ? (estadoEvaluaciones.noCalificados / total) * barMaxWidth : 0;

        // Barra para calificados
        const posYCalificados = doc.y;
        doc.fontSize(10).fillColor(colores.texto).text('Calificados:', 50, posYCalificados);
        doc.rect(150, posYCalificados, barWidth1, barHeight).fill(colores.exitoso);
        // Texto centrado en la barra
        if (barWidth1 >= 40) { // Solo si la barra es lo suficientemente ancha para mostrar texto
            doc.fillColor('white')
                .fontSize(12)
                .text(estadoEvaluaciones.calificados.toString(), 150 + (barWidth1 / 2) - 10, posYCalificados + 7, {
                    width: 20,
                    align: 'center'
                });
        } else {
            // Si la barra es muy pequeña, mostrar el número a la derecha
            doc.fillColor(colores.texto)
                .fontSize(10)
                .text(estadoEvaluaciones.calificados.toString(), 150 + barWidth1 + 5, posYCalificados + 8);
        }

        // Barra para no calificados
        doc.moveDown(1.5); // Aumentar espacio entre barras
        const posYNoCalificados = doc.y;
        doc.fontSize(10).fillColor(colores.texto).text('No Calificados:', 50, posYNoCalificados);
        doc.rect(150, posYNoCalificados, barWidth2, barHeight).fill(colores.advertencia);
        // Texto centrado en la barra
        if (barWidth2 >= 40) { // Solo si la barra es lo suficientemente ancha
            doc.fillColor('white')
                .fontSize(12)
                .text(estadoEvaluaciones.noCalificados.toString(), 150 + (barWidth2 / 2) - 10, posYNoCalificados + 7, {
                    width: 20,
                    align: 'center'
                });
        } else {
            // Si la barra es muy pequeña, mostrar el número a la derecha
            doc.fillColor(colores.texto)
                .fontSize(10)
                .text(estadoEvaluaciones.noCalificados.toString(), 150 + barWidth2 + 5, posYNoCalificados + 8);
        }

        doc.moveDown(2);

        // Sección: Proyectos por Tipo
        tituloSeccion('Proyectos por Tipo');

        // Gráfico de barras para proyectos por tipo
        const barWidthAula = (proyectosPorTipo.proyectosAula / (proyectosPorTipo.proyectosAula + proyectosPorTipo.proyectosSemillero || 1)) * barMaxWidth;
        const barWidthSemillero = (proyectosPorTipo.proyectosSemillero / (proyectosPorTipo.proyectosAula + proyectosPorTipo.proyectosSemillero || 1)) * barMaxWidth;

        // Barra para proyectos de aula
        const posYAula = doc.y;
        doc.fontSize(10).fillColor(colores.texto).text('Proyectos de Aula:', 50, posYAula);
        doc.rect(150, posYAula, barWidthAula, barHeight).fill('#4fc3f7');
        // Texto centrado en la barra
        if (barWidthAula >= 40) { // Solo si la barra es lo suficientemente ancha para mostrar texto
            doc.fillColor('white')
                .fontSize(12)
                .text(proyectosPorTipo.proyectosAula.toString(), 150 + (barWidthAula / 2) - 10, posYAula + 7, {
                    width: 20,
                    align: 'center'
                });
        } else {
            // Si la barra es muy pequeña, mostrar el número a la derecha
            doc.fillColor(colores.texto)
                .fontSize(10)
                .text(proyectosPorTipo.proyectosAula.toString(), 150 + barWidthAula + 5, posYAula + 8);
        }

        // Barra para proyectos de semillero
        doc.moveDown(1.5); // Aumentar espacio entre barras
        const posYSemillero = doc.y;
        doc.fontSize(10).fillColor(colores.texto).text('Proyectos de Semillero:', 50, posYSemillero);
        doc.rect(150, posYSemillero, barWidthSemillero, barHeight).fill('#7986cb');
        // Texto centrado en la barra
        if (barWidthSemillero >= 40) { // Solo si la barra es lo suficientemente ancha
            doc.fillColor('white')
                .fontSize(12)
                .text(proyectosPorTipo.proyectosSemillero.toString(), 150 + (barWidthSemillero / 2) - 10, posYSemillero + 7, {
                    width: 20,
                    align: 'center'
                });
        } else {
            // Si la barra es muy pequeña, mostrar el número a la derecha
            doc.fillColor(colores.texto)
                .fontSize(10)
                .text(proyectosPorTipo.proyectosSemillero.toString(), 150 + barWidthSemillero + 5, posYSemillero + 8);
        }

        // Comenzar nueva página para la sección de Proyectos en el Período
        doc.addPage();

        // Sección: Proyectos en el período seleccionado - ahora en página dedicada
        tituloSeccion(`Proyectos en el Período (${proyectos.length})`);
        doc.moveDown();

        if (proyectos.length === 0) {
            doc.fillColor(colores.texto).fontSize(12).text('No se encontraron proyectos en el período seleccionado.');
        } else {
            // Configuración de la tabla
            // Definición de variables para las filas y el padding
            const minRowHeight = 36; // Altura MÍNIMA de filas (crecerá si es necesario)
            const cellPadding = 10; // Padding para los textos dentro de las celdas (aumentado)
            const headerHeight = 40; // Altura del encabezado más grande para mayor legibilidad

            // Colores para las filas - Creamos dos colores para alternar
            const colorFilaPar = '#ffffff';     // Blanco para filas pares
            const colorFilaImpar = '#fff5f5';   // Rosa muy suave para filas impares

            // Funciones para calcular la altura necesaria del texto
            const calcularAlturaTexto = (texto: string, ancho: number, doc: PDFKit.PDFDocument) => {
                // Aproximación base: estimar 20 caracteres por línea para un ancho estándar de 100px
                const caracteresEstimadosPorLinea = Math.floor(ancho / 5);
                const lineasEstimadas = Math.ceil(texto.length / caracteresEstimadosPorLinea);

                // Altura de línea: 14px (aprox. para 10pt de tamaño de fuente)
                return Math.max(minRowHeight, lineasEstimadas * 14 + cellPadding * 2);
            };

            // Tabla de proyectos mejorada (ancho completo)
            // Configuración de columnas para usar todo el ancho de página, ahora con fecha de creación
            const columnWidths = {
                titulo: pageWidth * 0.25,          // 25% del ancho (reducido para dar espacio a la fecha)
                convocatoria: pageWidth * 0.25,    // 25% del ancho (reducido para dar espacio a la fecha)
                fecha: pageWidth * 0.18,           // 18% del ancho (nueva columna para fecha/hora)
                tipo: pageWidth * 0.12,            // 12% del ancho (se mantiene)
                puntaje: pageWidth * 0.20          // 20% del ancho (ligeramente aumentado)
            };

            // Posición inicial de la tabla
            let tablaStartY = doc.y;

            // Dibuja las líneas verticales divisorias de la tabla
            const drawTableGridLines = (startY: number, endY: number) => {
                let xLine = 50; // Posición inicial X

                // Líneas verticales internas (divisiones entre columnas)
                xLine += columnWidths.titulo;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.convocatoria;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.fecha;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.tipo;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                // Líneas horizontales para separar las filas
                return startY;
            };

            // Función para dibujar el encabezado de la tabla - enfoque más directo sin eventos de página
            const drawTableHeader = (y: number) => {
                // Guardar posición inicial 
                const headerStartY = y;

                // Dibujar el fondo del encabezado
                doc.rect(50, y, pageWidth, headerHeight)
                    .fill(colores.tablaEncabezado);

                // Calcular centrado vertical para textos del encabezado
                const textY = y + (headerHeight - 10) / 2;

                // Configurar estilo para los textos de encabezado - más grande y destacado
                doc.fillColor(colores.primario).fontSize(12).font('Helvetica-Bold');

                // Columna: TÍTULO - alineado a la izquierda con más padding
                const xTitulo = 50 + cellPadding;
                doc.text('TÍTULO', xTitulo, textY, { lineBreak: false });

                // Columna: CONVOCATORIA - alineado a la izquierda
                const xConvocatoria = 50 + columnWidths.titulo + cellPadding;
                doc.text('CONVOCATORIA', xConvocatoria, textY, { lineBreak: false });

                // Columna: FECHA - centrado en su columna
                const xFecha = 50 + columnWidths.titulo + columnWidths.convocatoria + (columnWidths.fecha / 2) - 20;
                doc.text('FECHA', xFecha, textY, { lineBreak: false });

                // Columna: TIPO - centrado en su columna
                const xTipo = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + (columnWidths.tipo / 2) - 15;
                doc.text('TIPO', xTipo, textY, { lineBreak: false });

                // Columna: PUNTAJE - centrado en su columna
                const xPuntaje = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + columnWidths.tipo + (columnWidths.puntaje / 2) - 25;
                doc.text('PUNTAJE', xPuntaje, textY, { lineBreak: false });

                // Volver a color de texto original
                doc.fillColor(colores.texto);

                // Dibujar línea bajo el encabezado
                const headerEndY = headerStartY + headerHeight;
                doc.moveTo(50, headerEndY).lineTo(50 + pageWidth, headerEndY).stroke(colores.tablaBorde);

                // Dibujar las líneas verticales del encabezado
                drawTableGridLines(headerStartY, headerEndY);

                return headerEndY;
            };

            // Dibujar encabezado
            let tablaY = drawTableHeader(tablaStartY);
            let colorAlternado = false;

            // Variable para guardar el número total de filas dibujadas
            let rowCount = 0;

            // Contenido de la tabla
            for (const proyecto of proyectos) {
                rowCount++;

                // Obtener y validar los datos para asegurar que no haya valores nulos
                // Verificar la existencia del titulo del proyecto
                console.log("Proyecto titulo :", proyecto.titulo);

                const titulo = proyecto.titulo || 'Sin título';
                console.log(`Procesando proyecto: ${titulo}`);

                // Determinar tipo de proyecto
                let tipoProyecto = 'No especificado';
                if (proyecto.proyectoAula) tipoProyecto = 'Aula';
                if (proyecto.proyectoSemillero) tipoProyecto = 'Semillero';

                // Verificar la existencia del título de la convocatoria
                const convocatoriaTitulo = proyecto.convocatoria?.titulo || 'Sin convocatoria';
                console.log(`Convocatoria: ${convocatoriaTitulo}`);

                // Formatear fecha de creación
                const fechaCreacion = new Date(proyecto.createdAt);
                const fechaFormateada = fechaCreacion.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const horaFormateada = fechaCreacion.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const fechaCompleta = `${fechaFormateada}\n${horaFormateada}`;

                const puntaje = proyecto.evaluacion ?
                    proyecto.evaluacion.puntajeTotal.toFixed(2) : 'No evaluado';

                // CALCULAR ALTURA DINÁMICA PARA LA FILA
                // Calcular altura necesaria para cada texto (título y convocatoria)
                const anchoDeTitulo = columnWidths.titulo - (2 * cellPadding);
                const anchoDeConvocatoria = columnWidths.convocatoria - (2 * cellPadding);

                const alturaTitulo = calcularAlturaTexto(titulo, anchoDeTitulo, doc);
                const alturaConvocatoria = calcularAlturaTexto(convocatoriaTitulo, anchoDeConvocatoria, doc);

                // Usar la altura más grande entre título y convocatoria
                const rowHeight = Math.max(alturaTitulo, alturaConvocatoria, minRowHeight);

                // Verificar si necesitamos una nueva página - asegurar que hay espacio para la fila completa
                if (tablaY + rowHeight > 700) {
                    // Cerrar tabla actual con un borde
                    doc.rect(50, tablaStartY, pageWidth, tablaY - tablaStartY)
                        .stroke(colores.tablaBorde);

                    // Nueva página
                    doc.addPage();
                    doc.font('Helvetica').fontSize(10).fillColor(colores.texto); // Restaurar formato predeterminado

                    // Añadir un encabezado en la nueva página para claridad
                    doc.font('Helvetica-Bold').fontSize(12).fillColor(colores.primario)
                        .text('Proyectos en el Período (continuación)', 50, 40, { continued: false, align: 'left' });
                    doc.moveDown(0.5);

                    tablaStartY = 60; // Posición inicial en la nueva página
                    tablaY = drawTableHeader(tablaStartY);
                    colorAlternado = false;
                }

                // Color de fondo para esta fila según su posición (par o impar)
                const colorFondo = rowCount % 2 === 0 ? colorFilaPar : colorFilaImpar;

                // Calcular posición Y centrada verticalmente para los textos
                const textCenterY = tablaY + (rowHeight - 10) / 2;

                // Paso 1: PRIMERO DIBUJAR TODOS LOS FONDOS DE LA FILA

                // Fondo base para toda la fila
                doc.rect(50, tablaY, pageWidth, rowHeight)
                    .fill(colorFondo);

                // Fondo especial para la columna de fecha
                doc.rect(50 + columnWidths.titulo + columnWidths.convocatoria, tablaY, columnWidths.fecha, rowHeight)
                    .fill('#fff0f0');

                // Fondo especial para la columna de tipo de proyecto
                const tipoColor = proyecto.proyectoSemillero ? '#ffece6' : '#f0f6ff';
                doc.rect(50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha, tablaY, columnWidths.tipo, rowHeight)
                    .fill(tipoColor);

                // Paso 2: DIBUJAR TODO EL TEXTO ENCIMA DE LOS FONDOS

                // Config baeie para todo el texto
                doc.fontSize(10).fillColor(colores.texto).font('Helvetica');

                // Título del proyecto - con salto de línea si es necesario
                doc.text(titulo, 50 + cellPadding, tablaY + cellPadding, {
                    width: columnWidths.titulo - (2 * cellPadding),
                    height: rowHeight - (2 * cellPadding),
                    align: 'left',
                    ellipsis: false  // No truncar con puntos suspensivos
                });

                // Convocatoria - con salto de línea si es necesario
                doc.text(convocatoriaTitulo, 50 + columnWidths.titulo + cellPadding, tablaY + cellPadding, {
                    width: columnWidths.convocatoria - (2 * cellPadding),
                    height: rowHeight - (2 * cellPadding),
                    align: 'left',
                    ellipsis: false  // No truncar con puntos suspensivos
                });

                // Fecha - en dos líneas y centrada
                const xFecha = 50 + columnWidths.titulo + columnWidths.convocatoria + (columnWidths.fecha / 2) - 30;
                doc.fillColor('#881c1c').font('Helvetica-Bold').fontSize(10);
                doc.text(fechaFormateada, xFecha, textCenterY - 8, { lineBreak: false });
                doc.fillColor('#662222').font('Helvetica').fontSize(9);
                doc.text(horaFormateada, xFecha, textCenterY + 6, { lineBreak: false });

                // Tipo de proyecto
                const xTipo = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + (columnWidths.tipo / 2) - 20;
                doc.fillColor('#a83232').font('Helvetica-Bold').fontSize(10);
                doc.text(tipoProyecto, xTipo, textCenterY, { lineBreak: false });

                // Puntaje
                let puntajeColor;
                if (proyecto.evaluacion) {
                    const puntajeNum = proyecto.evaluacion.puntajeTotal;
                    if (puntajeNum >= 70) {
                        puntajeColor = colores.exitoso;
                    } else if (puntajeNum >= 50) {
                        puntajeColor = '#ff9800';
                    } else {
                        puntajeColor = '#f44336';
                    }

                    // Para puntajes con evaluación, dibujar rectángulo con color
                    const xPuntaje = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + columnWidths.tipo;
                    const rectX = xPuntaje + columnWidths.puntaje / 2 - 20;
                    doc.rect(rectX, textCenterY - 10, 40, 20)
                        .fillAndStroke(puntajeColor, puntajeColor);

                    // Texto del puntaje en blanco
                    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
                    doc.text(puntaje.toString(), rectX + 5, textCenterY - 5, {
                        width: 30,
                        align: 'center',
                    });
                } else {
                    // Texto para no evaluados
                    const xPuntaje = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + columnWidths.tipo;
                    doc.fillColor('#9e9e9e').fontSize(10).font('Helvetica');
                    doc.text(puntaje.toString(), xPuntaje + cellPadding, textCenterY, {
                        lineBreak: false
                    });
                }

                doc.fillColor(colores.texto); // Restaurar color de texto

                // Dibujar línea horizontal después de la fila
                const rowEndY = tablaY + rowHeight;
                doc.moveTo(50, rowEndY).lineTo(50 + pageWidth, rowEndY).stroke(colores.tablaBorde);

                // Dibujar líneas verticales para esta fila para asegurar que la cuadrícula esté completa
                let xLine = 50;
                doc.moveTo(xLine, tablaY).lineTo(xLine, rowEndY).stroke(colores.tablaBorde);

                xLine += columnWidths.titulo;
                doc.moveTo(xLine, tablaY).lineTo(xLine, rowEndY).stroke(colores.tablaBorde);

                xLine += columnWidths.convocatoria;
                doc.moveTo(xLine, tablaY).lineTo(xLine, rowEndY).stroke(colores.tablaBorde);

                xLine += columnWidths.fecha;
                doc.moveTo(xLine, tablaY).lineTo(xLine, rowEndY).stroke(colores.tablaBorde);

                xLine += columnWidths.tipo;
                doc.moveTo(xLine, tablaY).lineTo(xLine, rowEndY).stroke(colores.tablaBorde);

                xLine += columnWidths.puntaje;
                doc.moveTo(xLine, tablaY).lineTo(xLine, rowEndY).stroke(colores.tablaBorde);

                // Avanzar a la siguiente fila
                tablaY = rowEndY;
            }

            // Completar líneas verticales para toda la tabla
            drawTableGridLines(tablaStartY, tablaY);

            // Borde exterior de la tabla (más grueso)
            doc.lineWidth(1.5);
            doc.rect(50, tablaStartY, pageWidth, tablaY - tablaStartY)
                .stroke(colores.tablaBorde);
            doc.lineWidth(1); // Restaurar grosor de línea

        }

        // Verificar si estamos en una página con contenido o no
        const paginaVacia = doc.y < 100;

        // Limpiar páginas vacías de manera segura
        try {
            // Si la página está vacía (porque se insertó automáticamente), eliminarla
            if (paginaVacia && doc.bufferedPageRange().count > 1) {
                // Verificar que _root y las propiedades anidadas existen antes de manipularlas
                const docAny = doc as any;
                if (docAny._root?.data?.Pages?.data?.Kids &&
                    Array.isArray(docAny._root.data.Pages.data.Kids) &&
                    docAny._root.data.Pages.data.Kids.length > 0) {

                    // Eliminar la última página vacía
                    docAny._root.data.Pages.data.Kids.pop();

                    // Actualizar el contador de páginas
                    if (typeof docAny._root.data.Pages.data.Count === 'number') {
                        docAny._root.data.Pages.data.Count--;
                    }
                }
            }
        } catch (error) {
            console.warn('Error al intentar eliminar página vacía:', error.message);
            // Continuar con la generación del PDF a pesar del error
        }

        // Volver a la última página válida de manera segura
        try {
            // Obtener el rango de páginas actual del buffer
            const range = doc.bufferedPageRange();
            const lastPage = Math.max(0, range.start + range.count - 1);

            // Solo cambiar de página si hay páginas disponibles y el índice es válido
            if (range.count > 0) {
                doc.switchToPage(lastPage);
            }
        } catch (error) {
            console.warn('Advertencia al cambiar de página:', error.message);
            // Continuar con la generación del PDF a pesar del error
        }

        // Pie de página con estilo
        doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(colores.primario);

        const fechaGeneracion = new Date().toLocaleString();
        doc.fillColor('white').fontSize(9)
            .text(`Reporte generado el ${fechaGeneracion} | Sistema de Gestión de Convocatorias`, 50, doc.page.height - 25, {
                align: 'center',
                continued: false
            });

        // Finalizar el documento
        doc.end();

        return promesa;
    }
}