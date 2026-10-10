import fsSync from "fs";

/**
 * Safely pipes an S3 stream to an Express Response.
 * Guarantees that the underlying S3 socket/stream is destroyed if the client disconnects,
 * errors, or finishes, preventing socket leaks and pool exhaustion.
 */
export function safePipeStream(
  stream: NodeJS.ReadableStream,
  req: any,
  res: any,
  onError?: (err: any) => void
): void {
  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    try {
      (stream as any).destroy?.();
    } catch {}
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
  res.on("close", cleanup);
  res.on("error", cleanup);
  res.on("finish", cleanup);

  stream.on("error", (err: any) => {
    cleanup();
    if (onError) {
      onError(err);
    } else if (!res.headersSent) {
      res.status(500).end();
    }
  });

  stream.pipe(res);
}

/**
 * Safely pipes an S3 stream to a local file write stream.
 * Ensures both streams are destroyed if an error occurs.
 */
export function safeDownloadStream(
  sourceStream: NodeJS.ReadableStream,
  destPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const writeStream = fsSync.createWriteStream(destPath);
    let isSettled = false;

    const cleanup = (err?: any) => {
      if (isSettled) return;
      isSettled = true;
      try {
        (sourceStream as any).destroy?.();
      } catch {}
      try {
        writeStream.destroy?.();
      } catch {}
      if (err) reject(err);
    };

    writeStream.on("finish", () => {
      if (isSettled) return;
      isSettled = true;
      try {
        (sourceStream as any).destroy?.();
      } catch {}
      resolve();
    });

    writeStream.on("error", cleanup);
    sourceStream.on("error", cleanup);
    sourceStream.pipe(writeStream);
  });
}
