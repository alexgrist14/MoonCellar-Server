import { PartialType } from '@nestjs/swagger';
import { CreateIgdbDto } from './create-igdb.dto';

export class UpdateIgdbDto extends PartialType(CreateIgdbDto) {}
