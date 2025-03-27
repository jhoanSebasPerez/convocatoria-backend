import { PartialType } from '@nestjs/mapped-types';
import { CreateCriterioDto } from './create-criterio.dto';

export class UpdateCriterioDto extends PartialType(CreateCriterioDto) {}
