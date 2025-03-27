import { IsString, IsInt, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class EvaluacionCriterioDto {
    @IsString()
    criterioId: string;

    @IsInt()
    puntaje: number;

    @IsOptional()
    @IsString()
    comentario?: string;
}

export class EvaluacionDto {
    @IsString()
    proyectoId: string;

    @IsInt()
    puntajeTotal: number;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvaluacionCriterioDto)
    criteriosEvaluacion: EvaluacionCriterioDto[];
}