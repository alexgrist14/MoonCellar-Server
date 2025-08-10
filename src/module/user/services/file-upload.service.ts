import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  S3Client,
  PutObjectCommandInput,
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

  async getBucketKeys(bucketName: string) {
    const s3Client = new S3Client(getS3Config());

    return await s3Client.send(new ListObjectsCommand({ Bucket: bucketName }));
  }

  async clearBucket(bucketName: string) {
    const s3Client = new S3Client(getS3Config());

    const keys = await s3Client.send(
      new ListObjectsCommand({ Bucket: bucketName })
    );

    return !!keys.Contents
      ? this.deleteFiles(
          keys.Contents?.map((key) => key.Key),
          bucketName
        )
      : "Empty";
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
