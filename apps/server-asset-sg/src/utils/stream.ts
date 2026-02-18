export async function streamToUint8Array(stream: NodeJS.ReadableStream): Promise<Uint8Array> {
  const buffer = await streamToBuffer(stream);
  return new Uint8Array(buffer);
}

export async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks = [];
  try {
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch (err: unknown) {
    throw new Error(`Stream reading failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
