import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { db, videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { s3Client, generatePresignedUrl, uploadFile, deleteObject } from "@workspace/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "./logger";

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const bucket = process.env.S3_BUCKET || "video-courses";

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

function runFfmpeg(inputPath: string, outputDir: string, durationLimit?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath)
      .outputOptions([
        "-profile:v baseline",
        "-level 3.0",
        "-start_number 0",
        "-hls_time 10",
        "-hls_list_size 0",
        "-f hls"
      ]);

    if (durationLimit) {
      cmd = cmd.setDuration(durationLimit);
    }

    cmd
      .output(path.join(outputDir, "manifest.m3u8"))
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

async function uploadDirToS3(dirPath: string, s3Prefix: string): Promise<void> {
  const files = await fs.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = await fs.readFile(filePath);
    const contentType = file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T";
    await uploadFile(`${s3Prefix}/${file}`, content, contentType);
  }
}

export async function processVideoAsync(videoId: number, sourceKey: string) {
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId));
  if (!video) throw new Error("Video not found");

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `video-${videoId}-`));
  const inputPath = path.join(tempDir, "input.mp4");
  const fullOutputDir = path.join(tempDir, "full");
  const previewOutputDir = path.join(tempDir, "preview");

  try {
    logger.info({ videoId }, "Starting video processing");
    await fs.mkdir(fullOutputDir);
    await fs.mkdir(previewOutputDir);

    logger.info({ videoId }, "Downloading source video from S3");
    await downloadFromS3(sourceKey, inputPath);

    const durationSeconds = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });

    logger.info({ videoId, durationSeconds }, "Processing full HLS");
    await runFfmpeg(inputPath, fullOutputDir);

    logger.info({ videoId }, "Processing preview HLS");
    const previewDuration = video.previewDurationSeconds || Math.min(durationSeconds * 0.2, 300); // max 5 minutes or 20%
    await runFfmpeg(inputPath, previewOutputDir, previewDuration);

    logger.info({ videoId }, "Uploading HLS to S3");
    const fullPrefix = `videos/${videoId}/full`;
    const previewPrefix = `videos/${videoId}/preview`;
    
    await uploadDirToS3(fullOutputDir, fullPrefix);
    await uploadDirToS3(previewOutputDir, previewPrefix);

    logger.info({ videoId }, "Updating database");
    await db.update(videosTable).set({
      processingStatus: "ready",
      durationSeconds: Math.floor(durationSeconds),
      hlsFullStorageKey: `${fullPrefix}/manifest.m3u8`,
      hlsPreviewStorageKey: `${previewPrefix}/manifest.m3u8`
    }).where(eq(videosTable.id, videoId));

    // Optional: delete source file from S3 to save space
    // await deleteObject(sourceKey);
    logger.info({ videoId }, "Video processing completed successfully");
  } catch (error) {
    logger.error({ videoId, error }, "Video processing failed");
    await db.update(videosTable).set({
      processingStatus: "failed",
      processingError: error instanceof Error ? error.message : "Unknown error"
    }).where(eq(videosTable.id, videoId));
  } finally {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
