import { HttpStatus, Injectable, ParseIntPipe } from '@nestjs/common';

const MAX_INT32 = 2_147_483_647;

/**
 * Validates that a path parameter is an integer id that fits into the database.
 * Since such a parameter identifies a resource, anything else is treated as a resource that does not exist.
 */
@Injectable()
export class ParseResourceIdPipe extends ParseIntPipe {
  constructor() {
    super({ errorHttpStatusCode: HttpStatus.NOT_FOUND });
  }

  override async transform(value: string, metadata: Parameters<ParseIntPipe['transform']>[1]): Promise<number> {
    const id = await super.transform(value, metadata);
    if (Math.abs(id) > MAX_INT32) {
      throw this.exceptionFactory('Id is out of range');
    }
    return id;
  }
}
