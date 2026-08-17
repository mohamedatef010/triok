import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.S3_ENDPOINT) {
  try {
    process.loadEnvFile?.();
  } catch {}
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

const bucket = process.env.S3_BUCKET || "video-courses";

let bucketVerified = false;

export async function ensureBucketExists(): Promise<void> {
  if (bucketVerified) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    bucketVerified = true;
  } catch (err: any) {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      bucketVerified = true;
      console.log(`[Storage] Bucket '${bucket}' created successfully.`);
    } catch (createErr) {
      console.warn(`[Storage] Could not create bucket '${bucket}' automatically:`, createErr);
    }
  }
}

export async function generateUploadUrl(key: string, contentType: string = "video/mp4", expiresIn: number = 3600): Promise<string> {
  await ensureBucketExists();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  await ensureBucketExists();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getObjectAsString(key: string): Promise<string> {
  await ensureBucketExists();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error("Empty response body");
  }
  return await response.Body.transformToString();
}

export async function uploadFile(key: string, body: Buffer | Uint8Array | string, contentType: string): Promise<void> {
  await ensureBucketExists();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

export async function deleteObject(key: string): Promise<void> {
  await ensureBucketExists();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3Client.send(command);
}

export { s3Client };

