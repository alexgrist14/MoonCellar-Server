import { PartialType } from '@nestjs/swagger';
import { SignUpDto } from './signup.dto';

export class UpdateAuthDto extends PartialType(SignUpDto) {}
