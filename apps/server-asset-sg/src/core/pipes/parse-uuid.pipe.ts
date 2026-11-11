import { HttpStatus, Injectable, ParseUUIDPipe } from '@nestjs/common';

/**
 * Validates that a path parameter is a UUID.
 * Since such a parameter identifies a resource, anything else is treated as a resource that does not exist.
 */
@Injectable()
export class ParseResourceUuidPipe extends ParseUUIDPipe {
  constructor() {
    super({ errorHttpStatusCode: HttpStatus.NOT_FOUND });
  }
}
