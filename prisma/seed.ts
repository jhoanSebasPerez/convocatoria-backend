import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Eliminando datos existentes...");

    // Eliminar datos en orden para evitar conflictos de claves foráneas
    await prisma.evaluacion.deleteMany();
    await prisma.proyecto.deleteMany();
    await prisma.convocatoria.deleteMany();
    await prisma.rubrica.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Datos eliminados. Insertando nuevos registros...");

    // 🔹 Crear Usuarios
    const admin = await prisma.user.create({
        data: {
            email: "admin@email.com",
            fullname: "Admin General",
            roles: ["ADMIN"],
            password: bcrypt.hashSync("admin123", 10),
        },
    });

    const docente = await prisma.user.create({
        data: {
            email: "docente@email.com",
            fullname: "Docente Ejemplo",
            roles: ["DOCENTE"],
            password: bcrypt.hashSync("docente123", 10),
        },
    });

    const estudiante1 = await prisma.user.create({
        data: {
            email: "estudiante1@email.com",
            fullname: "Estudiante 1",
            roles: ["ESTUDIANTE"],
            password: bcrypt.hashSync("estudiante123", 10),
        },
    });

    const estudiante2 = await prisma.user.create({
        data: {
            email: "estudiante2@email.com",
            fullname: "Estudiante 2",
            roles: ["ESTUDIANTE"],
            password: bcrypt.hashSync("estudiante123", 10),
        },
    });

    // 🔹 Crear una Rúbrica con Criterios
    const rubrica1 = await prisma.rubrica.upsert({
        where: { nombre: "Rúbrica General" },
        update: {}, // No actualizar nada si ya existe
        create: {
            nombre: "Rúbrica General",
            descripcion: "Rúbrica para evaluación de proyectos",
            criterios: {
                create: [
                    { nombre: "Originalidad", puntajeMax: 10, puntajeMin: 5, descripcion: "Evalúa la originalidad" },
                    { nombre: "Impacto", puntajeMax: 10, puntajeMin: 5, descripcion: "Evalúa el impacto del proyecto" },
                ],
            },
        },
        include: { criterios: true },
    });

    const rubrica2 = await prisma.rubrica.upsert({
        where: { nombre: "Rúbrica Específica" },
        update: {},
        create: {
            nombre: "Rúbrica Específica",
            descripcion: "Rúbrica para evaluación de proyectos específicos",
            criterios: {
                create: [
                    { nombre: "Viabilidad", puntajeMax: 10, puntajeMin: 5, descripcion: "Evalúa la viabilidad del proyecto" },
                    { nombre: "Sostenibilidad", puntajeMax: 10, puntajeMin: 5, descripcion: "Evalúa la sostenibilidad del proyecto" },
                ],
            },
        },
        include: { criterios: true },
    });

    // 🔹 Crear Convocatorias
    const convocatoria1 = await prisma.convocatoria.create({
        data: {
            titulo: "Convocatoria Innovación 2025",
            descripcion: "Convocatoria para proyectos innovadores",
            fechaInicio: new Date("2025-01-01"),
            fechaFin: new Date("2025-12-31"),
            isActive: true,
            rubricaId: rubrica1.id,
        },
    });

    const convocatoria2 = await prisma.convocatoria.create({
        data: {
            titulo: "Convocatoria Emprendimiento 2025",
            descripcion: "Convocatoria enfocada en startups",
            fechaInicio: new Date("2025-03-01"),
            fechaFin: new Date("2025-10-31"),
            isActive: true,
            rubricaId: rubrica2.id,
        },
    });

    // 🔹 Crear Proyectos (Aula y Semillero)
    const proyectoAula = await prisma.proyecto.create({
        data: {
            titulo: "Sistema de Energía Solar",
            resumen: "Proyecto sobre energía solar en comunidades rurales",
            convocatoriaId: convocatoria1.id,
            tiempoEjecucion: 6,
            fechaInicio: new Date("2025-02-01"),
            fechaFin: new Date("2025-08-01"),
            estudiantes: { connect: [{ id: estudiante1.id }, { id: estudiante2.id }] },
            proyectoAula: {
                create: {
                    curso: "Ingeniería Ambiental",
                    docenteOrientador: "Prof. Rodríguez",
                    estadoFormulacion: "Aprobado",
                    estadoEjecucion: "En curso",
                    estadoTerminado: "No",
                },
            },
        },
    });

    const proyectoSemillero = await prisma.proyecto.create({
        data: {
            titulo: "App de Salud Mental",
            resumen: "Aplicación para brindar ayuda psicológica gratuita",
            convocatoriaId: convocatoria2.id,
            tiempoEjecucion: 12,
            fechaInicio: new Date("2025-03-15"),
            fechaFin: new Date("2026-03-15"),
            estudiantes: { connect: [{ id: estudiante1.id }] },
            proyectoSemillero: {
                create: {
                    nombreSemillero: "Semillero Psicología Digital",
                    siglaSemillero: "SPD",
                    directorSemillero: "Dra. González",
                },
            },
        },
    });

    // 🔹 Evaluaciones
    await prisma.evaluacion.create({
        data: {
            proyectoId: proyectoAula.id,
            rubricaId: rubrica1.id,
            puntajeTotal: 18,
            observaciones: "Buen trabajo, pero necesita más detalles técnicos.",
            evaluadorId: docente.id,
            criteriosEvaluacion: {
                create: [
                    { criterioId: rubrica1.criterios[0].id, puntaje: 9 },
                    { criterioId: rubrica1.criterios[1].id, puntaje: 9 },
                ],
            },
        },
    });

    console.log("✅ Datos insertados correctamente.");
}

main()
    .catch((e) => {
        console.error("❌ Error en el seeder:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });