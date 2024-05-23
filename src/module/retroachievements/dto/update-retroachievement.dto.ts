import { PartialType } from '@nestjs/mapped-types';
import { CreateRetroachievementDto } from './create-retroachievement.dto';

export class UpdateRetroachievementDto extends PartialType(CreateRetroachievementDto) {}
