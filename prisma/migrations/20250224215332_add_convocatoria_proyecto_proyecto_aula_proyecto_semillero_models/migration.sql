-- CreateEnum
CREATE TYPE "TipoProyectoAula" AS ENUM ('INNOVACION', 'EMPRENDIMIENTO', 'APRENDIZAJE_AULA', 'INTEGRADOR');

-- CreateTable
CREATE TABLE "Convocatoria" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convocatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "tiempoEjecucion" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoAula" (
    "id" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "docenteOrientador" TEXT NOT NULL,
    "estadoFormulacion" TEXT NOT NULL,
    "estadoEjecucion" TEXT NOT NULL,
    "estadoTerminado" TEXT NOT NULL,
    "tipoProyecto" "TipoProyectoAula" NOT NULL,
    "modalidadPresentacion" TEXT NOT NULL DEFAULT 'POSTER',

    CONSTRAINT "ProyectoAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoSemillero" (
    "id" TEXT NOT NULL,
    "nombreSemillero" TEXT NOT NULL,
    "siglaSemillero" TEXT NOT NULL,
    "directorSemillero" TEXT NOT NULL,
    "modalidadPresentacion" TEXT NOT NULL DEFAULT 'ORAL',

    CONSTRAINT "ProyectoSemillero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProyectoToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProyectoToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProyectoToUser_B_index" ON "_ProyectoToUser"("B");

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "Convocatoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProyectoToUser" ADD CONSTRAINT "_ProyectoToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProyectoToUser" ADD CONSTRAINT "_ProyectoToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
