import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class FileUploadService {
  private readonly uploadPath = `/var/www/uploads/photos`;

  async uploadFile(
    file: Express.Multer.File,
    uploadFolder: string
  ): Promise<string> {
    const fileName = `${uuidv4()}-${file?.originalname}`;
    const filePath = join(this.uploadPath, fileName);

    await fs.mkdir(this.uploadPath, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return fileName;
  }

  async deleteFile(file: string) {
    const filePath = join(this.uploadPath, file);
    fs.access(filePath)
      .then(async () => {
        await fs.unlink(filePath);
      })
      .catch(() => {});
  }

  getFilePath(fileName: string): string {
    return join(this.uploadPath, fileName);
  }
}
