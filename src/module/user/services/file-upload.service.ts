import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  S3Client,
  PutObjectCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { getS3Config } from "src/shared/constants";

@Injectable()
export class FileService {
  async uploadObject(
    Body: PutObjectCommandInput["Body"],
    key: string,
    bucketName: string
  ) {
    const s3Client = new S3Client(getS3Config());

    return await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body,
      })
    );
  }

  async uploadFile(file: Express.Multer.File, key: string, bucketName: string) {
    const s3Client = new S3Client(getS3Config());

    return await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
      })
    );
  }

  async getBuckets() {
    const s3Client = new S3Client(getS3Config());

    return await s3Client.send(new ListBucketsCommand());
  }

  async getAllKeys(
    bucketName: string,
    options?: {
      callback?: (keys: string[]) => Promise<unknown>;
      prefix?: string;
    }
  ) {
    let keys = [];
    const s3Client = new S3Client(getS3Config());
    let continuationToken = null;

    do {
      const params: ListObjectsV2CommandInput = {
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        Prefix: options?.prefix,
      };

      try {
        const response = await s3Client.send(new ListObjectsV2Command(params));

        keys = !!response.Contents?.length
          ? keys.concat(response.Contents.map((item) => item.Key))
          : [];
        !!keys?.length && (await options?.callback?.(keys));
        continuationToken = response.NextContinuationToken;
      } catch (err) {
        console.error("Error fetching keys:", err);
        throw err;
      }
    } while (continuationToken);

    return keys;
  }

  async clearBucket(bucketName: string) {
    const size = 1000;
    const keys = await this.getAllKeys(bucketName);
    if (!keys?.length) return;

    for (let i = 0; i <= keys.length; i += size) {
      const slice = keys.slice(i, i + size);
      await this.deleteFiles(slice, bucketName);
      console.log(`Removed keys from ${i} to ${i + size}`);
    }

    return keys;
  }

  async getFile(key: string, bucketName: string) {
    const s3Client = new S3Client(getS3Config());

    const item = await s3Client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );

    return item.Body.transformToString();
  }

  async deleteFile(key: string, bucketName: string) {
    const s3Client = new S3Client(getS3Config());

    return await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  }

  async deleteFiles(keys: string[], bucketName: string) {
    const s3Client = new S3Client(getS3Config());

    return await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: keys.map((key) => ({ Key: key })) },
      })
    );
  }
}
