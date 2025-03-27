import { PartialType } from '@nestjs/mapped-types';
import { CreateRubricaDto } from './create-rubrica.dto';

export class UpdateRubricaDto extends PartialType(CreateRubricaDto) {}
