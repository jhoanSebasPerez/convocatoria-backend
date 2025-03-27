import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCriterioDto } from 'src/criterios/dto/create-criterio.dto';

export class CreateRubricaDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    descripcion: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCriterioDto)
    criterios: CreateCriterioDto[];

    @IsString()
    @IsOptional()
    convocatoriaId?: string;
}