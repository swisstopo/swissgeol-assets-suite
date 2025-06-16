import { Readable } from 'stream';
import { Geometry, serializeGeometryAsCsv, User } from '@asset-sg/shared/v2';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { GeometryRepo } from '@/features/geometries/geometry.repo';

@Controller('/geometries')
export class GeometriesController {
  constructor(private readonly geometryRepo: GeometryRepo) {}

  @Get('/')
  @Authorize.User()
  async list(@Res() res: Response, @CurrentUser() user: User): Promise<void> {
    // This route loads all geometries and encodes them as CSV.
    // CSV has been chosen as we have a large amount of geometries (13'000+)
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

    const { geometryRepo } = this;
    async function* load() {
      // The amount of geometries that have been read up to now.
      let count = 0;

      // The promise that is loading the next batch.
      // Note that this is running in parallel to the response writer.
      let next: Promise<Geometry[]> | null = geometryRepo.list({
        limit: INITIAL_BATCH_SIZE,
        offset: 0,
        workgroupIds: user.isAdmin ? null : [...user.roles.keys()],
      });

      // The maximal size of the next batch.
      let nextLimit = INITIAL_BATCH_SIZE;

      // Load batches until we don't load a new one.
      while (next != null) {
        // Wait for the database read to complete.
        const geometries: Geometry[] = await next;

        // Add the amount of geometries to the total counter.
        count += geometries.length;

        // We only start a new database read if we haven't loaded all existing geometries yet.
        next =
          geometries.length === 0 || geometries.length < nextLimit
            ? null
            : geometryRepo.list({ limit: BATCH_SIZE, offset: count });

        // Update the `nextLimit`, as in the first iteration, it's set to INITIAL_BATCH_SIZE.
        nextLimit = BATCH_SIZE;

        // Write the current batch to the response.
        for (const geometry of geometries) {
          yield serializeGeometryAsCsv(geometry);
          yield '\n';
        }
      }
    }

    const stream = Readable.from(load());
    stream.pipe(res);
  }
}
