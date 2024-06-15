import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = join(__dirname, '..', 'uploads');

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filepPath = join(this.uploadPath, fileName);

    await fs.mkdir(this.uploadPath, { recursive: true });
    await fs.writeFile(filepPath, file.buffer);

    return fileName;
  }

  getFilePath(fileName: string): string {
    return join(this.uploadPath, fileName);
  }
}
