import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, uploadFile, deleteObject } from "@workspace/storage";
import { logger } from "./logger";

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const bucket = process.env.S3_BUCKET || "video-courses";

export function getAuthorMediaPublicUrl(key: string): string {
  const filename = key.startsWith("author-media/") ? key.slice("author-media/".length) : key;
  return `/api/author-media/${filename}`;
}

async function downloadFromS3(key: string, destPath: string): Promise<void> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  if (!response.Body) throw new Error("No body in S3 response");

  return new Promise((resolve, reject) => {
    const stream = response.Body as unknown as NodeJS.ReadableStream;
    const writeStream = fsSync.createWriteStream(destPath);
    stream.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

export async function optimizeAuthorVideoFromS3(
  sourceKey: string,
): Promise<{ key: string; url: string }> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "author-video-"));
  const inputPath = path.join(tempDir, "input");
  const outputPath = path.join(tempDir, "output.mp4");

  try {
    logger.info({ sourceKey }, "Downloading author video for optimization");
    await downloadFromS3(sourceKey, inputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-vf",
          "scale='min(720,iw)':-2",
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "28",
          "-movflags",
          "+faststart",
          "-pix_fmt",
          "yuv420p",
          "-an",
          "-t",
          "30",
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const outputKey = `author-media/${Date.now()}-optimized.mp4`;
    const content = await fs.readFile(outputPath);
    await uploadFile(outputKey, content, "video/mp4");

    await deleteObject(sourceKey).catch(() => {});

    logger.info({ outputKey }, "Author video optimized successfully");
    return { key: outputKey, url: getAuthorMediaPublicUrl(outputKey) };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
