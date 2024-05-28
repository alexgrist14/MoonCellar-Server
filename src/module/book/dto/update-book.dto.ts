import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';
import { Category } from '../schemas/book.schema';
import {
  IsEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { User } from 'src/module/auth/schemas/user.schema';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @IsOptional()
  @IsString()
  readonly title: string;
  @IsOptional()
  @IsString()
  readonly description: string;
  @IsOptional()
  @IsString()
  readonly author: string;
  @IsOptional()
  @IsNumber()
  readonly price: number;
  @IsOptional()
  @IsEnum(Category, { message: 'Please enter correct category' })
  readonly category: Category;

  @IsEmpty({ message: 'You cannot pass user id' })
  readonly user: User;
}
