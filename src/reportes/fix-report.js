const fs = require('fs');
const path = require('path');

// Leer el archivo original
const filePath = path.join(__dirname, 'reportes.service.ts');
const originalContent = fs.readFileSync(filePath, 'utf8');

// Sección para la visualización de proyectos (código correcto)
const proyectosSection = `
        // -----------------------------------------------------------------
        // SECCIÓN: PROYECTOS EN EL PERÍODO (EN UNA NUEVA PÁGINA)
        // -----------------------------------------------------------------
        doc.addPage();
        tituloSeccion(\`Proyectos en el Período (\${proyectos.length})\`);
        doc.moveDown();

        if (proyectos.length === 0) {
            doc.fillColor(colores.texto).fontSize(12).text('No se encontraron proyectos en el período seleccionado.');
        } else {
            // Configuración de la tabla de proyectos
            const minRowHeight = 40;  // Altura mínima de filas
            const cellPadding = 10;    // Padding para las celdas

            // Ancho de columnas en la tabla
            const columnWidths = {
                titulo: 180,         // Título del proyecto
                convocatoria: 140,   // Convocatoria asociada
                fecha: 80,           // Fecha de creación
                tipo: 70,            // Tipo de proyecto
                puntaje: 70          // Puntaje/evaluación
            };

            // Ancho total de la tabla
            const tableWidth = columnWidths.titulo + columnWidths.convocatoria + 
                              columnWidths.fecha + columnWidths.tipo + columnWidths.puntaje;

            // Posición inicial de la tabla
            let tableStartY = doc.y;

            // Función para dibujar el encabezado de la tabla
            const drawTableHeader = (startY) => {
                // Fondo del encabezado con el color primario
                doc.rect(50, startY, tableWidth, 30)
                   .fill(colores.primario);

                // Configuración de texto del encabezado
                doc.fillColor('white').font('Helvetica-Bold').fontSize(12);

                // Posición Y centrada para el texto del encabezado
                const textY = startY + 10;

                // Dibujar los textos del encabezado
                doc.text('TÍTULO', 50 + cellPadding, textY);
                doc.text('CONVOCATORIA', 50 + columnWidths.titulo + cellPadding, textY);
                doc.text('FECHA', 50 + columnWidths.titulo + columnWidths.convocatoria + cellPadding, textY);
                doc.text('TIPO', 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + cellPadding, textY);
                doc.text('PUNTAJE', 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + columnWidths.tipo + cellPadding, textY);

                // Restaurar estilo de texto
                doc.font('Helvetica').fillColor(colores.texto).fontSize(10);

                // Retornar la posición Y después del encabezado
                return startY + 30;
            };

            // Función para dibujar las líneas verticales divisorias de la tabla
            const drawVerticalLines = (startY, endY) => {
                let xLine = 50;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.titulo;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.convocatoria;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.fecha;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.tipo;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);

                xLine += columnWidths.puntaje;
                doc.moveTo(xLine, startY).lineTo(xLine, endY).stroke(colores.tablaBorde);
            };

            // Dibujar encabezado de la tabla
            let tableY = drawTableHeader(tableStartY);
            let colorAlternado = false;

            // Procesar cada proyecto
            console.log(\`Total de proyectos a procesar: \${proyectos.length}\`);
            for (let i = 0; i < proyectos.length; i++) {
                const proyecto = proyectos[i];
                console.log(\`Procesando proyecto \${i + 1}: \${proyecto.titulo}\`);

                // 1. PREPARAR DATOS SIN TRUNCAR
                const titulo = proyecto.titulo;
                const convocatoriaTitulo = proyecto.convocatoria.titulo;

                // Determinar tipo de proyecto
                let tipoProyecto = 'No especificado';
                if (proyecto.proyectoAula) tipoProyecto = 'Aula';
                if (proyecto.proyectoSemillero) tipoProyecto = 'Semillero';

                // Formatear fecha y hora
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

                // Puntaje formateado
                const puntaje = proyecto.evaluacion ?
                    proyecto.evaluacion.puntajeTotal.toFixed(2) : 'No evaluado';

                // 2. CALCULAR ALTURA DINÁMICA PARA LA FILA
                const tituloLines = Math.ceil(titulo.length / 25);
                const convocatoriaLines = Math.ceil(convocatoriaTitulo.length / 25);
                const maxLines = Math.max(tituloLines, convocatoriaLines, 1);
                const filaHeight = Math.max(minRowHeight, maxLines * 14 + 10);

                // 3. VERIFICAR SI NECESITAMOS NUEVA PÁGINA
                if (tableY + filaHeight > 700) {
                    // Cerrar tabla actual
                    doc.rect(50, tableStartY, tableWidth, tableY - tableStartY)
                       .stroke(colores.tablaBorde);

                    // Nueva página
                    doc.addPage();
                    doc.font('Helvetica').fontSize(10).fillColor(colores.texto);

                    // Título en la nueva página
                    doc.font('Helvetica-Bold').fontSize(12).fillColor(colores.primario)
                       .text('Proyectos en el Período (continuación)', 50, 40, { align: 'center' });
                    doc.moveDown(0.5);

                    // Reiniciar posición y dibujar nuevo encabezado
                    tableStartY = doc.y;
                    tableY = drawTableHeader(tableStartY);
                    colorAlternado = false;
                }

                // 4. DIBUJAR FONDO DE LA FILA
                if (colorAlternado) {
                    doc.rect(50, tableY, tableWidth, filaHeight)
                       .fill(colores.tablaFilaAlt);
                }
                colorAlternado = !colorAlternado;

                // 5. DIBUJAR CONTENIDO DE LA FILA
                // Calcular posición Y centrada para el texto
                const textY = tableY + (filaHeight / 2) - 5;

                // Título del proyecto - Primera columna
                doc.fontSize(10).fillColor(colores.texto);
                doc.text(titulo, 50 + cellPadding, tableY + cellPadding, {
                    width: columnWidths.titulo - (2 * cellPadding),
                    height: filaHeight - (2 * cellPadding),
                    align: 'left'
                });

                // Convocatoria - Segunda columna
                doc.text(convocatoriaTitulo, 50 + columnWidths.titulo + cellPadding, tableY + cellPadding, {
                    width: columnWidths.convocatoria - (2 * cellPadding),
                    height: filaHeight - (2 * cellPadding),
                    align: 'left'
                });

                // Fecha - Tercera columna (con formato especial)
                const xFecha = 50 + columnWidths.titulo + columnWidths.convocatoria + cellPadding;
                doc.fillColor('#881c1c').fontSize(9);
                doc.text(fechaFormateada, xFecha, textY - 8, {
                    width: columnWidths.fecha - (2 * cellPadding),
                    align: 'center'
                });
                doc.fillColor('#662222').fontSize(8);
                doc.text(horaFormateada, xFecha, textY + 4, {
                    width: columnWidths.fecha - (2 * cellPadding),
                    align: 'center'
                });

                // Tipo de proyecto - Cuarta columna
                const xTipo = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + cellPadding;
                doc.fillColor('#992222').fontSize(10);
                doc.text(tipoProyecto, xTipo, textY, {
                    width: columnWidths.tipo - (2 * cellPadding),
                    align: 'center'
                });

                // Puntaje - Quinta columna (con color según valor)
                const xPuntaje = 50 + columnWidths.titulo + columnWidths.convocatoria + columnWidths.fecha + columnWidths.tipo + cellPadding;

                // Determinar color según puntaje
                let puntajeColor;
                if (proyecto.evaluacion) {
                    const puntajeNum = proyecto.evaluacion.puntajeTotal;
                    if (puntajeNum >= 70) {
                        puntajeColor = '#4caf50'; // Verde para puntajes altos
                    } else if (puntajeNum >= 50) {
                        puntajeColor = '#ff9800'; // Naranja para puntajes intermedios
                    } else {
                        puntajeColor = '#f44336'; // Rojo para puntajes bajos
                    }
                } else {
                    puntajeColor = '#9e9e9e'; // Gris para no evaluados
                }

                // Dibujar puntaje con estilo visual
                if (proyecto.evaluacion) {
                    // Rectángulo coloreado para el puntaje
                    const rectX = xPuntaje + (columnWidths.puntaje / 2) - 20;
                    doc.rect(rectX, textY - 10, 40, 20)
                       .fillAndStroke(puntajeColor, puntajeColor);

                    // Texto en blanco sobre el rectángulo
                    doc.fillColor('white').text(puntaje, xPuntaje, textY - 4, {
                        width: columnWidths.puntaje - (2 * cellPadding),
                        align: 'center'
                    });
                } else {
                    // Texto gris para no evaluados
                    doc.fillColor(puntajeColor).text(puntaje, xPuntaje, textY - 4, {
                        width: columnWidths.puntaje - (2 * cellPadding),
                        align: 'center'
                    });
                }

                // Restaurar color de texto original
                doc.fillColor(colores.texto);

                // Avanzar a la siguiente fila
                tableY += filaHeight;

                // Dibujar línea horizontal para separar filas
                doc.moveTo(50, tableY).lineTo(50 + tableWidth, tableY).stroke(colores.tablaBorde);
            }

            // Finalizar la tabla
            // Dibujar líneas verticales divisorias
            drawVerticalLines(tableStartY, tableY);

            // Borde exterior de la tabla
            doc.lineWidth(1.5);
            doc.rect(50, tableStartY, tableWidth, tableY - tableStartY)
               .stroke(colores.tablaBorde);
            doc.lineWidth(1); // Restaurar grosor de línea

            // Añadir espacio después de la tabla
            doc.moveDown(2);
        }`;

// Función para encontrar la posición correcta para insertar la sección de proyectos
// Busca después de la sección de proyectos por tipo y antes del pie de página
function findInsertPosition(content) {
    // Ubicar después de la sección de Proyectos por Tipo
    const afterProyectosPorTipo = content.indexOf("doc.moveDown(2);", content.indexOf("tituloSeccion('Proyectos por Tipo')"));

    // Ubicar antes del pie de página
    const beforeFooter = content.indexOf("// Pie de página con estilo");

    // Si encontramos las dos posiciones, insertamos entre ellas
    if (afterProyectosPorTipo !== -1 && beforeFooter !== -1) {
        return content.indexOf('\n', afterProyectosPorTipo) + 1;
    }

    // Caso de fallback
    return content.indexOf("// Pie de página con estilo");
}

// Encontrar la posición para insertar la sección de proyectos
const insertPosition = findInsertPosition(originalContent);

// Crear el contenido modificado
const modifiedContent = originalContent.substring(0, insertPosition) +
    proyectosSection +
    '\n        ' + // Espacio antes del pie de página
    originalContent.substring(insertPosition);

// Escribir el archivo modificado
const backupPath = path.join(__dirname, 'reportes.service.backup.ts');
fs.writeFileSync(backupPath, originalContent, 'utf8');
console.log(`Se ha creado una copia de seguridad en: ${backupPath}`);

fs.writeFileSync(filePath, modifiedContent, 'utf8');
console.log(`El archivo ha sido actualizado exitosamente: ${filePath}`);
