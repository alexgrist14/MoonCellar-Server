import { dirname, join } from 'path';

export const rootDir = join(dirname(process.argv[1]), '..');

export const ACCESS_TOKEN = 'accessMoonToken';
export const REFRESH_TOKEN = 'refreshMoonToken';

export const accessExpire = 7 * 24 * 60 * 60 * 1000;
export const refreshExpire = 30 * 24 * 60 * 60 * 1000;
