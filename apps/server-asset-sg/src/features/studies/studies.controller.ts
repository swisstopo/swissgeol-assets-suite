import { Readable } from 'stream';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { RequireRole } from '@/core/decorators/require-role.decorator';
import { Study } from '@/features/studies/study.model';
import { StudyRepo } from '@/features/studies/study.repo';
import { Role } from '@/features/users/user.model';

@Controller('/studies')
export class StudiesController {
  constructor(private readonly studyRepo: StudyRepo) {}

  @Get('/')
  @RequireRole(Role.Viewer)
  async list(@Res() res: Response): Promise<void> {
    // This route loads all studies and encodes them as CSV.
    // CSV has been chosen as we have a large amount of studies (13'000+)
    // and need a concise format that can be processed in batches (which, for example, JSON can't).

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Transfer-Encoding', 'chunked');

    // The size of the first load.
    // This should be a relatively small number, as unlike all subsequent batches,
    // the first batch can't be run in parallel with a response write.
    const INITIAL_BATCH_SIZE = 500;

    // The size of the second and all subsequent batches.
    // This value should be chosen so that it approximately evens out the duration
    // of a database read and a response write of a batch, as they are run in parallel.
    const BATCH_SIZE = 2_500;

    const { studyRepo } = this;
    async function* load() {
      // The amount of studies that have been read up to now.
      let count = 0;

      // The promise that is loading the next batch.
      // Note that this is running in parallel to the response writer.
      let next: Promise<Study[]> | null = studyRepo.list({ limit: INITIAL_BATCH_SIZE, offset: 0 });

      // The maximal size of the next batch.
      let nextLimit = INITIAL_BATCH_SIZE;

      // Load batches until we don't load a new one.
      while (next != null) {
        // Wait for the database read to complete.
        const studies: Study[] = await next;

        // Add the amount of studies to the total counter.
        count += studies.length;

        // We only start a new database read if we haven't loaded all existing studies yet.
        next =
          studies.length === 0 || studies.length < nextLimit
            ? null
            : studyRepo.list({ limit: BATCH_SIZE, offset: count });

        // Update the `nextLimit`, as in the first iteration, it's set to INITIAL_BATCH_SIZE.
        nextLimit = BATCH_SIZE;

        // Write the current batch to the response.
        for (const study of studies) {
          yield `${study.id.substring(6)};${study.assetId};${+study.isPoint};${study.center.x};${study.center.y}\n`;
        }
      }
    }

    const stream = Readable.from(load());
    stream.pipe(res);
  }
}
