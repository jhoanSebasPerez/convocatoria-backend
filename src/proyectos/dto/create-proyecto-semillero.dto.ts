import { IsString } from "class-validator";

export class CreateProyectoSemilleroDto {
    @IsString()
    nombreSemillero: string;

    @IsString()
    siglaSemillero: string;

    @IsString()
    directorSemillero: string;

    @IsString()
    modalidadPresentacion: string;
}