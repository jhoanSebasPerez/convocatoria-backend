import { Type } from 'class-transformer';
import { IsString, IsDate, Length, IsOptional } from 'class-validator';

export class CreateConvocatoriaDto {
    @IsString()
    @Length(1, 100)
    titulo: string;

    @IsString()
    @Length(1, 500)
    descripcion: string;

    @IsDate()
    @Type(() => Date)
    fechaInicio: Date;

    @IsDate()
    @Type(() => Date)
    fechaFin: Date;

    @IsString()
    @IsOptional()
    rubricaId: string;
}