import { IsString, IsEnum } from "class-validator";
import { TipoProyectoAula } from "@prisma/client";

export class CreateProyectoAulaDto {
    @IsString()
    curso: string;

    @IsString()
    docenteOrientador: string;

    @IsString()
    estadoFormulacion: string;

    @IsString()
    estadoEjecucion: string;

    @IsString()
    estadoTerminado: string;

    @IsEnum(TipoProyectoAula)
    tipoProyecto: TipoProyectoAula;

    @IsString()
    modalidadPresentacion: string;
}