#!/usr/bin/env node

/**
 * Syncs asset files from one S3 bucket to another, driven by files referenced in the specified assets database.
 *
 *
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  IMPORTANT: Any desired PostgreSQL DB dump and import into another DBMS   ║
 * ║  must be executed manually, before or after syncing the assets.           ║
 * ║  This script only handles the s3 file synchronization!                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Steps performed:
 *   1. Query the configured database for the list of files belonging to the specified workgroup(s),
 *      or all workgroups if none are specified.
 *   2. Optionally delete ALL objects under the INT (destination) S3 path (opt-in via --delete-dest-files).
 *   3. Scan all file sizes via HeadObject (20 concurrent) and group them into
 *      single (≤ 5 GB) and multipart (> 5 GB) lists, printing an overview with
 *      exact GB totals per group before any copy starts.
 *   4. Copy in two phases (no data flows through this machine):
 *      Phase 1 — single files:    worker pool of 20, CopyObject.
 *      Phase 2 — multipart files: sequential, multipart copy API.
 *      Both phases use byte-accurate ETA (all sizes are known from step 3).
 *      Source tags are stripped (TaggingDirective=REPLACE) to avoid
 *      PutObjectTagging permission errors.
 *
 * Authentication:
 *   Uses the AWS default credential provider chain — the same credentials already
 *   configured for the AWS CLI (env vars, ~/.aws/credentials, IAM role, etc.).
 *   No separate configuration is required.
 *
 * Prerequisites:
 *   - Node.js >= 18.
 *   - Run `npm install` inside the `scripts/` folder once to install dependencies.
 *   - AWS credentials with read access to the source bucket and read/write/delete
 *     access to the destination bucket.
 *
 * Usage:
 *   node scripts/swissgeol-assets-s3-sync.mjs \
 *     --src-bucket  <name> \
 *     --src-path  <path> \
 *     --dest-bucket <name> \
 *     --dest-path <path> \
 *     --db          <pg-connection-string> \
 *     --workgroups  <name[,name...]> \
 *     [--delete-dest-files] \
 *     [--region     <aws-region>] \
 *     [--dry-run]
 *
 * PROD → INT example (fill in the actual DB credentials):
 * node swissgeol-assets-s3-sync.mjs \                                                                                        ─╯
 *     --src-bucket  swissgeol-assets-swisstopo \
 *     --src-path  asset/asset_files/ \
 *     --dest-bucket swissgeol-assets-int-swisstopo \
 *     --dest-path asset/TEST/ \
 *     --db "postgresql://asset-swissgeol@asset-swissgeol-prod.db.swissgeol.ch:5432/asset-swissgeol" \
 *     --workgroups  "Swisstopo" \
 *
 * Passwords with special characters might be problematic on command line
 *
 * Alternatively, avoid embedding the password in the connection string at all by
 * using the PGPASSWORD environment variable — the pg library picks it up automatically:
 *   export PGPASSWORD='your password with $pecial ch@rs'
 *   node scripts/swissgeol-assets-s3-sync.mjs \
 *     --db "postgresql://<user>@<host>:5432/<dbname>" ...
 *
 * Multiple workgroups:
 *   --workgroups "Swisstopo, BAFU, Meteoschweiz"
 */

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCopyCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import pg from "pg";
import readline from "node:readline";

// ---------------------------------------------------------------------------
// Confirmation prompt
// ---------------------------------------------------------------------------

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const args = {
    srcBucket: null,
    srcPath: null,
    destBucket: null,
    destPath: null,
    db: null,
    dbSsl: false,
    dbSslNoVerify: false,
    workgroups: null, // null = all workgroups
    deleteDestFiles: false,
    region: "eu-central-1",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--src-bucket":
        args.srcBucket = argv[++i];
        break;
      case "--src-path":
        args.srcPath = argv[++i];
        break;
      case "--dest-bucket":
        args.destBucket = argv[++i];
        break;
      case "--dest-path":
        args.destPath = argv[++i];
        break;
      case "--db":
        args.db = argv[++i];
        break;
      case "--workgroups":
        // Accept comma-separated list; trim whitespace around each entry
        args.workgroups = argv[++i]
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean);
        break;
      case "--delete-dest-files":
        args.deleteDestFiles = true;
        break;
      case "--region":
        args.region = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      default:
        console.error(`❌ Unknown argument: ${argv[i]}\n`);
        printHelp();
        process.exit(1);
    }
  }

  // workgroups is optional — null means all workgroups
  const missing = ["srcBucket", "srcPath", "destBucket", "destPath", "db"].filter((k) => !args[k]);

  if (missing.length > 0) {
    const flags = missing.map((k) => `--${k.replace(/([A-Z])/g, "-$1").toLowerCase()}`);
    console.error(`❌ Error: missing required argument(s): ${flags.join(", ")}\n`);
    printHelp();
    process.exit(1);
  }

  // Normalise pathes: ensure they end with "/"
  if (!args.srcPath.endsWith("/")) args.srcPath += "/";
  if (!args.destPath.endsWith("/")) args.destPath += "/";

  return args;
}

function printHelp() {
  console.log(`
swissgeol-assets-s3-sync — Sync S3 asset files from Source (srcBucket/srcPath) to S3 Destination  (dstBucket/dstPath\`) based on DB workgroup membership.

USAGE
  node scripts/swissgeol-assets-s3-sync.mjs [options]

REQUIRED OPTIONS
  --src-bucket  <name>          Source S3 bucket name
  --src-path    <path>          Source S3 key path  (e.g. asset/asset_files/)
  --dest-bucket <name>          Destination S3 bucket name
  --dest-path   <path>          Destination S3 key path  (e.g. assets/asset_files/)
  --db          <conn-string>   PostgreSQL connection string
                                  e.g. "postgresql://user:pass@host:5432/dbname"
                                  ⚠ Special characters in the password must be
                                  URL-encoded (e.g. @ → %40, # → %23, $ → %24).
                                  Encode with: node -e "process.stdout.write(encodeURIComponent('yourpassword'))"
                                  Or omit the password from the URL and set it via
                                  the PGPASSWORD environment variable instead:
                                    export PGPASSWORD='p@ss#word'
                                    --db "postgresql://user@host:5432/dbname"

OPTIONAL OPTIONS
  --workgroups  <list>          Comma-separated list of workgroup names to include.
                                  Whitespace around commas is ignored.
                                  Omit to copy files for ALL workgroups.
                                  e.g. "Swisstopo"
                                  e.g. "Swisstopo, BAFU, Meteoschweiz"
  --delete-dest-files           Delete ALL existing files at the destination path
                                  before copying. By default the destination is left
                                  untouched and files are only added/overwritten.
  --region      <aws-region>    AWS region  (default: eu-central-1)
  --dry-run                     Print all operations without executing any of them
  --help, -h                    Show this help text

AUTHENTICATION
  Uses the AWS default credential provider chain — identical to the AWS CLI.
  No separate configuration needed if the CLI is already set up.

PROD → INT EXAMPLE (with Password stored in $PGPASSWORD)
  node swissgeol-assets-s3-sync.mjs \\                                                                                        ─╯
    --src-bucket  swissgeol-assets-swisstopo \\
    --src-path  asset/asset_files/ \\
    --dest-bucket swissgeol-assets-int-swisstopo \\
    --dest-path asset/TEST/ \\
    --db "postgresql://asset-swissgeol@asset-swissgeol-prod.db.swissgeol.ch:5432/asset-swissgeol" \\
    --workgroups  "Swisstopo" \\
    --dry-run

  If the password contains special characters, URL-encode it:
    node -e "process.stdout.write(encodeURIComponent('yourpassword'))"
  Or use PGPASSWORD and omit the password from the URL:
    export PGPASSWORD='p@ss#word'
    --db "postgresql://<user>@<prod-host>:5432/assets"

NOTE
  The PostgreSQL DB dump from PROD must be imported into INT manually
  BEFORE running this script. This script only handles S3 file synchronisation.
`);
}

// ---------------------------------------------------------------------------
// Database query
// ---------------------------------------------------------------------------

async function fetchFileNames(connectionString, workgroups, dbSsl, dbSslNoVerify) {
  const client = new pg.Client({ connectionString, ...{ ssl: { rejectUnauthorized: false } } });
  await client.connect();

  try {
    // When workgroups is null (not specified), fetch files for all workgroups.
    // Otherwise use a parameterised ANY($1) check to filter safely.
    const { rows } = workgroups
      ? await client.query(
          `SELECT f.file_name
           FROM asset AS a
             INNER JOIN workgroup  AS w  ON w.id         = a.workgroup_id
             INNER JOIN asset_file AS af ON af.asset_id  = a.asset_id
             INNER JOIN file       AS f  ON f.id         = af.file_id
           WHERE w.name = ANY($1)`,
          [workgroups],
        )
      : await client.query(
          `SELECT f.file_name
           FROM asset AS a
             INNER JOIN asset_file AS af ON af.asset_id  = a.asset_id
             INNER JOIN file       AS f  ON f.id         = af.file_id`,
        );
    return rows.map((r) => r.file_name);
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// S3 helpers

// Formats a filename for aligned dry-run output: always 15 chars wide.
// Names longer than 10 chars are truncated to "..." + last 7 chars.
function formatFileNameFixed(name) {
  const display = name.length > 18 ? `...${name.slice(-15)}` : name;
  return display.padStart(18);
}

// ---------------------------------------------------------------------------
// Terminal UI — sticky status area + scrolling log above it
// ---------------------------------------------------------------------------

class TerminalUI {
  #statusHeight = 0;
  #tty;
  #lastRedraw = 0;
  #pendingLines = null; // throttled — waiting to be drawn
  #currentLines = null; // last lines actually drawn (used to redraw after log)
  #THROTTLE_MS = 100;

  constructor() {
    this.#tty = Boolean(process.stdout.isTTY);
  }

  // Print a scrolling log line. Erases the status bar, writes the line,
  // then immediately redraws the bar below it.
  log(line) {
    if (this.#tty) {
      this.#erase();
      process.stdout.write(line + "\n");
      const toRedraw = this.#pendingLines ?? this.#currentLines;
      if (toRedraw) this.#draw(toRedraw);
    } else {
      process.stdout.write(line + "\n");
    }
  }

  // Replace the sticky status block — throttled to avoid flicker.
  setStatus(lines) {
    if (!this.#tty) return;
    this.#pendingLines = lines;
    if (Date.now() - this.#lastRedraw >= this.#THROTTLE_MS) {
      this.#draw(lines);
      this.#pendingLines = null;
    }
  }

  // Remove the status block (call before printing the final summary).
  clear() {
    if (this.#tty) {
      this.#pendingLines = null;
      this.#currentLines = null;
      this.#erase();
    }
  }

  #draw(lines) {
    this.#erase();
    for (const line of lines) process.stdout.write(line + "\n");
    this.#statusHeight = lines.length;
    this.#lastRedraw = Date.now();
    this.#currentLines = lines;
  }

  #erase() {
    for (let i = 0; i < this.#statusHeight; i++) process.stdout.write("\x1b[1A\x1b[2K");
    this.#statusHeight = 0;
  }
}

function makeProgressBar(done, total) {
  const cols = process.stdout.columns ?? 80;
  const barWidth = Math.max(20, Math.min(50, cols - 32));
  const pct = total > 0 ? done / total : 0;
  const filled = Math.round(pct * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
  return `[${bar}] ${done}/${total} (${Math.round(pct * 100)}%)`;
}

function fmtMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function fmtEta(done, total, elapsedMs) {
  if (done === 0 || elapsedMs === 0) return "–";
  return `~${fmtMs(Math.round((elapsedMs / done) * (total - done)))}`;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ---------------------------------------------------------------------------
// Pre-flight S3 access check
// ---------------------------------------------------------------------------

async function checkS3Access(s3, srcBucket, srcPath, destBucket, destPath) {
  console.log("\n[Step 2/5] Pre-flight S3 access check ...");

  const errors = [];

  // 1. Check source: list up to 1 key under srcPath to confirm read access + valid token.
  process.stdout.write("  Source bucket  (ListObjects) ... ");
  try {
    await s3.send(new ListObjectsV2Command({ Bucket: srcBucket, Prefix: srcPath, MaxKeys: 1 }));
    console.log("✓");
  } catch (err) {
    const detail = [err.Code ?? err.code ?? err.name, err.message].filter(Boolean).join(" — ");
    console.log(`✗  ${detail}`);
    errors.push(`Source read access: ${detail}`);
  }

  // 2. Check destination: put a tiny sentinel object and immediately delete it.
  const sentinelKey = `${destPath}.s3sync-preflight-${Date.now()}`;
  process.stdout.write("  Destination bucket  (PutObject) ... ");
  try {
    await s3.send(
      new PutObjectCommand({ Bucket: destBucket, Key: sentinelKey, Body: Buffer.alloc(0), ContentLength: 0 }),
    );
    console.log("✓");
  } catch (err) {
    const detail = [err.Code ?? err.code ?? err.name, err.message].filter(Boolean).join(" — ");
    console.log(`✗  ${detail}`);
    errors.push(`Destination write access: ${detail}`);
  }

  process.stdout.write("  Destination bucket  (DeleteObject) ... ");
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: destBucket, Key: sentinelKey }));
    console.log("✓");
  } catch (err) {
    const detail = [err.Code ?? err.code ?? err.name, err.message].filter(Boolean).join(" — ");
    console.log(`✗  ${detail}`);
    errors.push(`Destination delete access: ${detail}`);
  }

  if (errors.length > 0) {
    console.error("\n❌ Pre-flight check failed — your AWS token may be expired or missing permissions:");
    for (const e of errors) console.error(`  • ${e}`);
    console.error("\n  Refresh your AWS credentials and try again.");
    process.exit(1);
  }

  console.log("  All checks passed.\n");
}

// ---------------------------------------------------------------------------

async function listAllKeys(s3, bucket, path) {
  const keys = [];
  let continuationToken;
  // Ensure the prefix ends with "/" so we never accidentally list the entire bucket
  // when the path is empty, and never match sibling keys that share a common prefix
  // (e.g. "assets/TEST" would also match "assets/TEST2/…").
  const prefix = path.endsWith("/") ? path : `${path}/`;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken }),
    );
    for (const obj of res.Contents ?? []) {
      keys.push(obj.Key);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function deleteAllInPath(s3, bucket, path, dryRun) {
  console.log(`\n[Step 3/5] Listing objects to delete under s3://${bucket}/${path} ...`);
  const keys = await listAllKeys(s3, bucket, path);

  if (keys.length === 0) {
    console.log("  Destination path is already empty.");
    return;
  }

  console.log(`  Found ${keys.length} object(s) to delete.`);

  if (dryRun) {
    console.log(`  [DRY-RUN] Would delete ${keys.length} object(s) from s3://${bucket}/${path}`);
    return;
  }

  const answer = dryRun
    ? true
    : await prompt(`  ⚠️  Permanently delete ${keys.length} object(s) from s3://${bucket}/${path}? [y/N] `);
  if (answer.trim().toLowerCase() !== "y") {
    console.log("  Deletion skipped.");
    return;
  }

  // S3 batch delete accepts up to 1000 keys per request
  const BATCH_SIZE = 1000;
  let deleted = 0;

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE).map((Key) => ({ Key }));
    await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch, Quiet: true } }));
    deleted += batch.length;
    process.stdout.write(`\r  Deleted: ${deleted}/${keys.length}`);
  }

  console.log(`\r  Deleted: ${deleted}/${keys.length} ✓`);
}

// S3 CopyObjectCommand limit: 5 GB. Files above this require multipart copy.
const COPY_OBJECT_MAX_BYTES = 5 * 1024 * 1024 * 1024;
// Part size for multipart copy: 512 MB (well within the 5 GB part limit, keeps part count low).
const MULTIPART_PART_SIZE = 512 * 1024 * 1024;

// URL-encode each path segment of an S3 key (preserving "/" separators) so that
// the CopySource header is valid even when file names contain spaces or special chars.
function encodeSrcKey(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}

async function copySingleObject(s3, srcBucket, srcKey, destBucket, destKey) {
  await s3.send(
    new CopyObjectCommand({
      CopySource: `${srcBucket}/${encodeSrcKey(srcKey)}`,
      Bucket: destBucket,
      Key: destKey,
      // Replace tags with an empty set — avoids permission errors when source
      // objects carry tags that the caller cannot read/write on the destination.
      TaggingDirective: "REPLACE",
      Tagging: "",
    }),
  );
}

async function copyMultipart(s3, srcBucket, srcKey, destBucket, destKey, contentLength) {
  const { UploadId } = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: destBucket,
      Key: destKey,
      // Tags are not propagated — multipart upload starts fresh.
      Tagging: "",
    }),
  );

  const parts = [];
  try {
    let byteOffset = 0;
    let partNumber = 1;

    while (byteOffset < contentLength) {
      const end = Math.min(byteOffset + MULTIPART_PART_SIZE - 1, contentLength - 1);
      const { CopyPartResult } = await s3.send(
        new UploadPartCopyCommand({
          Bucket: destBucket,
          Key: destKey,
          UploadId,
          PartNumber: partNumber,
          CopySource: `${srcBucket}/${encodeSrcKey(srcKey)}`,
          CopySourceRange: `bytes=${byteOffset}-${end}`,
        }),
      );
      parts.push({ PartNumber: partNumber, ETag: CopyPartResult.ETag });
      byteOffset = end + 1;
      partNumber++;
    }

    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: destBucket,
        Key: destKey,
        UploadId,
        MultipartUpload: { Parts: parts },
      }),
    );
  } catch (err) {
    // Always abort incomplete multipart uploads to avoid storage charges.
    await s3.send(new AbortMultipartUploadCommand({ Bucket: destBucket, Key: destKey, UploadId }));
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Size scan
// ---------------------------------------------------------------------------

async function scanFileSizes(s3, fileNames, srcBucket, srcPath) {
  const ui = new TerminalUI();
  const t0 = Date.now();
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

  console.log(`\n[Step 4/5] Scanning ${fileNames.length} file(s) for sizes ...`);

  const singleFiles = []; // { fileName, contentLength, sizeUnknown? }
  const multiFiles = []; // { fileName, contentLength }
  const missing = []; // { fileName, reason } — confirmed 404 in source

  let scanned = 0;
  let notFound = 0;
  let sizeUnknown = 0;

  const redraw = () => ui.setStatus([`  ${makeProgressBar(scanned + notFound + sizeUnknown, fileNames.length)}`]);

  redraw();

  let idx = 0;
  await Promise.all(
    Array.from({ length: 20 }, async () => {
      while (idx < fileNames.length) {
        const fileName = fileNames[idx++];
        try {
          const { ContentLength } = await s3.send(
            new HeadObjectCommand({ Bucket: srcBucket, Key: `${srcPath}${fileName}` }),
          );
          (ContentLength > COPY_OBJECT_MAX_BYTES ? multiFiles : singleFiles).push({
            fileName,
            contentLength: ContentLength,
          });
          scanned++;
        } catch (err) {
          const is404 = err.name === "NotFound" || err.$metadata?.httpStatusCode === 404;
          if (is404) {
            missing.push({ fileName, reason: "not found in source" });
            notFound++;
          } else {
            // Queue for copy anyway; it will surface a real error there if it truly fails.
            singleFiles.push({ fileName, contentLength: 0, sizeUnknown: true });
            sizeUnknown++;
          }
        }
        redraw();
      }
    }),
  );

  ui.clear();

  const fmtGb = (b) => `${(b / 1024 ** 3).toFixed(2)} GB`;
  const singleBytes = singleFiles.reduce((s, f) => s + f.contentLength ?? 0, 0);
  const multiBytes = multiFiles.reduce((s, f) => s + f.contentLength, 0);

  console.log(`  ✓ Done in ${fmtMs(Date.now() - t0)}\n\n`);

  if (missing.length > 0) {
    console.log(`\n  ⚠  Missing / unavailable in source: ${missing.length} file(s) — will be skipped`);
    for (const { fileName, reason } of missing) {
      console.log(`    ✗ ${trunc(fileName, 64).padEnd(65)}  ${reason}`);
    }
  }

  if (multiFiles.length > 0) {
    console.log(`\n\n  Large files (copied sequentially in Phase 2, after all smaller files (<5GB) finish):`);
    for (const { fileName, contentLength } of multiFiles) {
      const gb = (contentLength / 1024 ** 3).toFixed(2);
      console.log(`    • ${trunc(fileName, 62).padEnd(63)}  ${gb} GB`);
    }
  }

  console.log(
    `\n  Phase 1 — single copy   (≤ 5 GB):  ${String(singleFiles.length).padStart(6)} file(s)   ${fmtGb(singleBytes).padStart(12)}`,
  );
  console.log(
    `\n  Phase 2 — multipart copy (> 5 GB): ${String(multiFiles.length).padStart(6)} file(s)   ${fmtGb(multiBytes).padStart(12)}`,
  );

  console.log(`\n  ${"─".repeat(54)}`);
  console.log(
    `  Will copy:  ${String(singleFiles.length + multiFiles.length).padStart(6)} file(s)   ${fmtGb(singleBytes + multiBytes).padStart(12)}`,
  );
  console.log(`  Missing:    ${String(missing.length).padStart(6)} file(s)`);
  console.log("");

  return { singleFiles, multiFiles, missing };
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

async function copyFiles(s3, singleFiles, multiFiles, srcBucket, srcPath, destBucket, destPath, dryRun) {
  const ui = new TerminalUI();
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  const allErrors = [];

  if (dryRun) {
    console.log(`\n[Step 5/5] (DRY-RUN) Would copy ${singleFiles.length + multiFiles.length} file(s).`);
    for (const { fileName } of [...singleFiles, ...multiFiles]) {
      console.log(`  [DRY-RUN] cp ${formatFileNameFixed(fileName)} → s3://${destBucket}/${destPath}${fileName}`);
    }
    return { copied: singleFiles.length + multiFiles.length, errors: [] };
  }

  // ── Phase 1: single copies (worker pool of 20) ───────────────────────────

  if (singleFiles.length > 0) {
    const totalBytes = singleFiles.reduce((s, f) => s + f.contentLength, 0);
    const startTime = Date.now();
    const fmtGb = (b) => `${(b / 1024 ** 3).toFixed(2)} GB`;

    console.log(`\n[Step 5/5] Phase 1 — ${singleFiles.length} single file(s)  (${fmtGb(totalBytes)}) ...`);
    ui.log("");

    let copied = 0,
      copyErrors = 0,
      bytesCopied = 0,
      totalMs = 0;
    const active = new Map(); // fileName → true

    const redraw = () => {
      const elapsed = Date.now() - startTime;
      const lines = [];
      if (active.size > 0) {
        lines.push(`  Active (${active.size}):`);
        for (const name of active.keys()) lines.push(`    ⋯ ${trunc(name, 64)}`);
      }
      lines.push("");
      const avg = copied > 0 ? `   avg ${fmtMs(Math.round(totalMs / copied))}` : "";
      lines.push(`  Copied: ${String(copied).padStart(6)}/${singleFiles.length}   errors: ${copyErrors}${avg}`);
      let etaStr = "–";
      if (bytesCopied > 0 && elapsed > 0) {
        const rem = totalBytes - bytesCopied;
        etaStr = rem > 0 ? `~${fmtMs(Math.round(rem / (bytesCopied / elapsed)))}` : "finishing…";
      }
      lines.push(`  ${makeProgressBar(copied + copyErrors, singleFiles.length)}  ETA ${etaStr}`);
      ui.setStatus(lines);
    };

    let idx = 0;
    await Promise.all(
      Array.from({ length: 20 }, async () => {
        while (idx < singleFiles.length) {
          const { fileName, contentLength } = singleFiles[idx++];
          const t0 = Date.now();
          active.set(fileName, true);
          redraw();
          try {
            await copySingleObject(s3, srcBucket, `${srcPath}${fileName}`, destBucket, `${destPath}${fileName}`);
            const ms = Date.now() - t0;
            copied++;
            totalMs += ms;
            bytesCopied += contentLength;
            active.delete(fileName);
            ui.log(`  ✓  ${trunc(fileName, 64)}  ${fmtMs(ms)}`);
            redraw();
          } catch (err) {
            const ms = Date.now() - t0;
            active.delete(fileName);
            copyErrors++;
            const detail = [err.Code ?? err.code ?? err.name, err.message, err.cause?.message]
              .filter(Boolean)
              .join(" — ");
            allErrors.push({ fileName, error: detail });
            ui.log(`  ✗  ${trunc(fileName, 60)}  ${fmtMs(ms)}  ${trunc(detail, 55)}`);
            redraw();
          }
        }
      }),
    );

    ui.clear();
    console.log(`  Phase 1 complete: ${copied} copied, ${copyErrors} errors.`);
  }

  // ── Phase 2: multipart copies (sequential) ───────────────────────────────

  if (multiFiles.length > 0) {
    const totalBytes = multiFiles.reduce((s, f) => s + f.contentLength, 0);
    const startTime = Date.now();
    const fmtGb = (b) => `${(b / 1024 ** 3).toFixed(2)} GB`;

    console.log(`\n[Step 5/5] Phase 2 — ${multiFiles.length} large file(s) via multipart  (${fmtGb(totalBytes)}) ...`);
    ui.log("");

    let copied = 0,
      copyErrors = 0,
      bytesCopied = 0,
      totalMs = 0;
    const active = new Map(); // fileName → sizeMb string

    const redraw = () => {
      const elapsed = Date.now() - startTime;
      const lines = [];
      if (active.size > 0) {
        lines.push(`  Active:`);
        for (const [name, sizeMb] of active) {
          lines.push(`    ⋯ [multipart]  ${trunc(name, 52)}  ${sizeMb} MB`);
        }
      }
      lines.push("");
      const avg = copied > 0 ? `   avg ${fmtMs(Math.round(totalMs / copied))}` : "";
      lines.push(`  Copied: ${String(copied).padStart(3)}/${multiFiles.length}   errors: ${copyErrors}${avg}`);
      let etaStr = "–";
      if (bytesCopied > 0 && elapsed > 0) {
        const rem = totalBytes - bytesCopied;
        etaStr = rem > 0 ? `~${fmtMs(Math.round(rem / (bytesCopied / elapsed)))}` : "finishing…";
      }
      lines.push(`  ${makeProgressBar(copied + copyErrors, multiFiles.length)}  ETA ${etaStr}`);
      ui.setStatus(lines);
    };

    redraw();

    for (const { fileName, contentLength } of multiFiles) {
      const sizeMb = (contentLength / 1024 ** 2).toFixed(0);
      const t0 = Date.now();
      active.set(fileName, sizeMb);
      redraw();
      try {
        await copyMultipart(
          s3,
          srcBucket,
          `${srcPath}${fileName}`,
          destBucket,
          `${destPath}${fileName}`,
          contentLength,
        );
        const ms = Date.now() - t0;
        copied++;
        totalMs += ms;
        bytesCopied += contentLength;
        active.delete(fileName);
        ui.log(`  ✓  ${trunc(fileName, 58)}  ${sizeMb} MB  ${fmtMs(ms)}`);
        redraw();
      } catch (err) {
        const ms = Date.now() - t0;
        active.delete(fileName);
        copyErrors++;
        const detail = [err.Code ?? err.code ?? err.name, err.message, err.cause?.message].filter(Boolean).join(" — ");
        allErrors.push({ fileName, error: detail });
        ui.log(`  ✗  ${trunc(fileName, 56)}  ${sizeMb} MB  ${fmtMs(ms)}  ${trunc(detail, 48)}`);
        redraw();
      }
    }

    ui.clear();
    console.log(`  Phase 2 complete: ${copied} copied, ${copyErrors} errors.`);
  }

  const totalCopied = singleFiles.length + multiFiles.length - allErrors.length;
  return { copied: totalCopied, errors: allErrors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║  IMPORTANT: Any desired PostgreSQL DB dump and import into another DBMS   ║");
  console.log("║  must be executed manually, before or after syncing the assets.           ║");
  console.log("║  This script only handles the s3 file synchronization!                    ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝");

  console.log("=== swissgeol-assets-s3-sync ===");
  console.log(`  Source      : s3://${args.srcBucket}/${args.srcPath}`);
  console.log(`  Destination : s3://${args.destBucket}/${args.destPath}`);
  console.log(`  Database    : ${args.db.replace(/:\/\/[^@]+@/, "://<credentials>@")}`);
  console.log(`  Workgroups  : ${args.workgroups ? args.workgroups.join(", ") : "ALL (no filter)"}`);
  console.log(
    `  Delete dest : ${args.deleteDestFiles ? "yes — destination will be wiped before copy" : "no (use --delete-dest-files to wipe first)"}`,
  );
  console.log(`  Region      : ${args.region}`);
  if (args.dryRun) console.log("  Mode        : ⚠️ DRY-RUN — no changes will be made");
  console.log("");

  const s3 = new S3Client({ region: args.region });

  // Step 1: query DB for file list (before confirmation so the user sees the count)
  console.log("[Step 1/5] Querying the source database for asset files ...");
  const fileNames = await fetchFileNames(args.db, args.workgroups, args.dbSsl, args.dbSslNoVerify);
  console.log(`  Found ${fileNames.length} file(s).`);

  if (fileNames.length === 0) {
    console.log("No files found in the database query. Exiting.");
    return;
  }

  console.log("");
  const ok = await confirm("⚠️  Proceed with the sync?");
  if (!ok) {
    console.log("Aborted.");
    process.exit(0);
  }
  console.log("");

  // Step 2: pre-flight access check — verify token and permissions before doing anything destructive
  await checkS3Access(s3, args.srcBucket, args.srcPath, args.destBucket, args.destPath);

  // Step 3: optionally delete all objects at destination path
  if (args.deleteDestFiles) {
    await deleteAllInPath(s3, args.destBucket, args.destPath, args.dryRun);
  } else {
    console.log("\n[Step 3/5] Skipping destination deletion (use --delete-dest-files to enable).");
  }

  // Step 4: scan all file sizes and group into single / multipart
  const { singleFiles, multiFiles, missing } = await scanFileSizes(s3, fileNames, args.srcBucket, args.srcPath);

  // Confirm before copying

  const totalCopyable = singleFiles.length + multiFiles.length;
  if (totalCopyable === 0) {
    console.log("Nothing to copy. Exiting.");
    return;
  }
  const answer = await prompt(
    `Proceed with copying ${totalCopyable} file(s)` +
      (missing.length > 0 ? ` (${missing.length} missing file(s) will be skipped)` : "") +
      `? [y/N] `,
  );
  if (answer.trim().toLowerCase() !== "y") {
    console.log("Aborted.");
    return;
  }

  // Step 4: copy files in two phases
  const { copied, errors } = await copyFiles(
    s3,
    singleFiles,
    multiFiles,
    args.srcBucket,
    args.srcPath,
    args.destBucket,
    args.destPath,
    args.dryRun,
  );

  const modeLabel = args.dryRun ? "would be copied" : "copied";
  console.log(
    `\nDone. Files ${modeLabel}: ${copied}, Errors: ${errors.length}` +
      (missing.length > 0 ? `, Skipped (missing in source): ${missing.length}` : ""),
  );

  if (errors.length > 0) {
    console.error("\n❌ Copy failures:");
    for (const { fileName, error } of errors) {
      console.error(`  ⚠️ ${fileName} — ${error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
