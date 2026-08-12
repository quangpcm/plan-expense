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
    // Force path-style (https://{accountId}.r2.cloudflarestorage.com/{bucket}/{key}) instead of
    // the SDK's default virtual-hosted-style (https://{bucket}.{accountId}.r2.cloudflarestorage.com/{key}).
    // Presigned URLs here are PUT to directly by a browser fetch(); path-style is the
    // widely-recommended addressing mode for R2/S3-compatible storage to avoid subdomain/CORS
    // inconsistencies with the bucket-name-as-subdomain form.
    forcePathStyle: true,
    // Presigned URLs here are consumed by a plain browser fetch(), which cannot compute the
    // matching x-amz-checksum-* header the SDK would otherwise bake into the signature by
    // default (since SDK v3's default is 'WHEN_SUPPORTED'). Without this, PutObject uploads
    // fail after a real file body is sent, since the signed checksum was computed against an
    // empty body at presign time.
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  return cachedClient;
}

export function getR2BucketName(): string {
  return getRequiredEnv('R2_BUCKET_NAME');
}
