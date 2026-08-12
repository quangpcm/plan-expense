import { S3Client } from '@aws-sdk/client-s3';

import { AppError } from '@/shared/errors/app-error';

let cachedClient: S3Client | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new AppError(`R2 configuration is missing: ${name}.`, 'R2_NOT_CONFIGURED', 500);
  }

  return value;
}

export function getR2Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const accountId = getRequiredEnv('R2_ACCOUNT_ID');

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  });

  return cachedClient;
}

export function getR2BucketName(): string {
  return getRequiredEnv('R2_BUCKET_NAME');
}
