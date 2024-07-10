import { Readable } from 'stream';
import { Controller, Get, Res } from '@nestjs/common';
import { serializeStudyAsCsv, Study } from '@shared/models/study';
import { User } from '@shared/models/user';
import { Response } from 'express';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { StudyRepo } from '@/features/studies/study.repo';

@Controller('/studies')
export class StudiesController {
  constructor(private readonly studyRepo: StudyRepo) {}

  @Get('/')
  @Authorize.User()
  async list(@Res() res: Response, @CurrentUser() user: User): Promise<void> {
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
      let next: Promise<Study[]> | null = studyRepo.list({
        limit: INITIAL_BATCH_SIZE,
        offset: 0,
        workgroupIds: user.isAdmin ? null : user.workgroups.map((it) => it.id),
      });

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
          yield serializeStudyAsCsv(study);
          yield '\n';
        }
      }
    }

    const stream = Readable.from(load());
    stream.pipe(res);
  }
}
