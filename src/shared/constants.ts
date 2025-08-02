import { S3ClientConfig } from "@aws-sdk/client-s3";
import { dirname, join } from "path";

export const rootDir = join(dirname(process.argv[1]), "..");

export const ACCESS_TOKEN = "accessMoonToken";
export const REFRESH_TOKEN = "refreshMoonToken";

export const accessExpire = 7 * 24 * 60 * 60 * 1000;
export const refreshExpire = 30 * 24 * 60 * 60 * 1000;

export const RA_MAIN_USER_NAME = "alexgrist14";

export const getS3Config = (): S3ClientConfig => ({
  endpoint: "https://s3.regru.cloud",
  region: "ru-central1",
  credentials: {
    accessKeyId: process.env.S3_ID,
    secretAccessKey: process.env.S3_KEY,
  },
});
