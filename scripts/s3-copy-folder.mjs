#!/usr/bin/env node

/**
 * Copies all objects from one S3 "folder" to another within the same bucket.
 *
 * Usage:
 *   node scripts/s3-copy-folder.mjs <bucket> <source-prefix> <dest-prefix>
 *
 * Example:
 *   node scripts/s3-copy-folder.mjs my-bucket uploads/2025/ archive/2025/
 *
 * Environment variables (optional – falls back to default AWS credential chain):
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const [bucket, srcPrefix, destPrefix] = process.argv.slice(2);

if (!bucket || !srcPrefix || !destPrefix) {
  console.error("Usage: node scripts/s3-copy-folder.mjs <bucket> <source-prefix> <dest-prefix>");
  process.exit(1);
}

const s3 = new S3Client({});

async function listAllKeys(prefix) {
  const keys = [];
  let continuationToken;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of res.Contents ?? []) {
      keys.push(obj.Key);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function copyObject(srcKey, destKey) {
  console.log(`Downloading ${destKey} to ${srcKey}`);
  const { Body, ContentType } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: srcKey }));
  console.log(`Uploading ${destKey} to ${destKey}`);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: destKey,
      Body,
      ContentType,
      Tagging: "",
    },
  });
  await upload.done();
}

async function main() {
  console.log(`Listing objects in s3://${bucket}/${srcPrefix} ...`);
  const srcKeys = await listAllKeys(srcPrefix);

  if (srcKeys.length === 0) {
    console.log("No objects found. Nothing to copy.");
    return;
  }

  console.log(`Found ${srcKeys.length} object(s). Checking destination for existing files...`);
  const destKeys = new Set(await listAllKeys(destPrefix));

  const keysToCopy = srcKeys.filter((key) => {
    const destKey = destPrefix + key.slice(srcPrefix.length);
    return !destKeys.has(destKey);
  });

  const skipped = srcKeys.length - keysToCopy.length;
  if (skipped > 0) {
    console.log(`Skipping ${skipped} object(s) that already exist at destination.`);
  }

  if (keysToCopy.length === 0) {
    console.log("All objects already exist. Nothing to copy.");
    return;
  }

  console.log(`Copying ${keysToCopy.length} object(s)...`);

  // Lower batch size — each copy now streams through this process.
  const BATCH_SIZE = 1;
  let copied = 0;
  const errors = [];

  for (let i = 0; i < keysToCopy.length; i += BATCH_SIZE) {
    const batch = keysToCopy.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (key) => {
        const destKey = destPrefix + key.slice(srcPrefix.length);
        try {
          await copyObject(key, destKey);
          copied++;
          if (copied % 100 === 0 || copied === keysToCopy.length) {
            console.log(`  ${copied}/${keysToCopy.length}`);
          }
        } catch (err) {
          errors.push({ key, error: err.message ?? err });
          console.error(`  ERROR copying ${key}: ${err.message ?? err}`);
        }
      }),
    );
  }

  console.log(`\nDone. Copied: ${copied}, Skipped (already exist): ${skipped}, Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.error("\nFailed keys:");
    for (const { key, error } of errors) {
      console.error(`  ${key} — ${error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
