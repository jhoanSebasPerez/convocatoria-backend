import { IsString, IsInt, IsDateString, ValidateNested, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { CreateProyectoAulaDto } from "./create-proyecto-aula.dto";
import { CreateProyectoSemilleroDto } from "./create-proyecto-semillero.dto";

export class CreateProyectoDto {
    @IsString()
    titulo: string;

    @IsString()
    resumen: string;

    @IsString()
    convocatoriaId: string;

    @IsInt()
    tiempoEjecucion: number;

    @IsOptional()
    @IsString()
    documentoUrl?: string;

    @IsDateString()
    fechaInicio: string;

    @IsDateString()
    fechaFin: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateProyectoAulaDto)
    proyectoAula?: CreateProyectoAulaDto;

    @IsArray()
    estudiantes?: { fullname: string, email: string }[];

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateProyectoSemilleroDto)
    proyectoSemillero?: CreateProyectoSemilleroDto;
}