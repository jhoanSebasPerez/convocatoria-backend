import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class CreateCriterioDto {

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsNumber()
    @Min(0)
    puntajeMax: number;

    @IsNumber()
    @Min(0)
    puntajeMin: number;

    @IsString()
    descripcion: string;
}