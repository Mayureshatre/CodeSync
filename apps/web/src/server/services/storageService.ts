import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

function getS3Client() {
  if (process.env.NODE_ENV === 'test' && !process.env.S3_ACCESS_KEY_ID) {
    return new S3Client({
      region: 'us-east-1',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      endpoint: 'http://localhost:9000'
    });
  }

  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    ...(endpoint && { endpoint }),
  });
}

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_RESUME_TYPES = ['application/pdf'];
const RESUME_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function getExtension(mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'application/pdf': return 'pdf';
    default: throw new Error('Unsupported MIME type');
  }
}

export function isValidAvatarUrl(userId: string, url: string): boolean {
  if (!url) return true; // empty allowed
  const bucket = process.env.S3_BUCKET_PUBLIC || 'codesync-public';
  let expectedPrefix = `https://${bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/avatars/${userId}/`;
  
  if (process.env.S3_ENDPOINT) {
    const endpoint = new URL(process.env.S3_ENDPOINT);
    expectedPrefix = `${endpoint.protocol}//${bucket}.${endpoint.host}/avatars/${userId}/`;
  } else if (process.env.NODE_ENV === 'test') {
    // For local tests without S3_ENDPOINT
    expectedPrefix = `http://${bucket}.localhost:9000/avatars/${userId}/`;
  }

  return url.startsWith(expectedPrefix);
}

export async function generatePresignedAvatarUploadUrl(userId: string, mimeType: string, contentLength: number) {
  if (!ALLOWED_AVATAR_TYPES.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_AVATAR_TYPES.join(', ')}`);
  }
  if (contentLength > AVATAR_MAX_SIZE) {
    throw new Error(`File size exceeds the limit of ${AVATAR_MAX_SIZE / 1024 / 1024}MB`);
  }

  const s3 = getS3Client();
  const uuid = crypto.randomUUID();
  const ext = getExtension(mimeType);
  const key = `avatars/${userId}/${uuid}.${ext}`;
  const bucket = process.env.S3_BUCKET_PUBLIC || 'codesync-public';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: contentLength,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  let publicUrl = `https://${bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  if (process.env.S3_ENDPOINT) {
    const endpoint = new URL(process.env.S3_ENDPOINT);
    publicUrl = `${endpoint.protocol}//${bucket}.${endpoint.host}/${key}`;
  } else if (process.env.NODE_ENV === 'test') {
    publicUrl = `http://${bucket}.localhost:9000/${key}`;
  }

  return { url, key, publicUrl };
}

export async function generatePresignedResumeUploadUrl(userId: string, mimeType: string, contentLength: number) {
  if (!ALLOWED_RESUME_TYPES.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_RESUME_TYPES.join(', ')}`);
  }
  if (contentLength > RESUME_MAX_SIZE) {
    throw new Error(`File size exceeds the limit of ${RESUME_MAX_SIZE / 1024 / 1024}MB`);
  }

  const s3 = getS3Client();
  const uuid = crypto.randomUUID();
  const ext = getExtension(mimeType);
  const key = `resumes/${userId}/${uuid}.${ext}`;
  const bucket = process.env.S3_BUCKET_PRIVATE || 'codesync-private';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: contentLength,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return { url, key };
}

export async function generatePresignedDownloadUrl(key: string) {
  const s3 = getS3Client();
  const bucket = process.env.S3_BUCKET_PRIVATE || 'codesync-private';

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 60 });
}

export async function deleteObject(key: string, isPublic: boolean = false) {
  const s3 = getS3Client();
  const bucket = isPublic 
    ? (process.env.S3_BUCKET_PUBLIC || 'codesync-public')
    : (process.env.S3_BUCKET_PRIVATE || 'codesync-private');

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(command);
}
