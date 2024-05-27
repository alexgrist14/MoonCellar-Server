import { CreateBookDto } from './create-book.dto';
import { Category } from '../schemas/book.schema';
declare const UpdateBookDto_base: import("@nestjs/common").Type<Partial<CreateBookDto>>;
export declare class UpdateBookDto extends UpdateBookDto_base {
    readonly title: string;
    readonly description: string;
    readonly author: string;
    readonly price: number;
    readonly category: Category;
}
export {};
