import { Reflector } from '@nestjs/core';

import { Class } from 'type-fest';
import { FindRepo } from '@/core/repo';

export const UseRepo = Reflector.createDecorator<Class<FindRepo<unknown, unknown>>>();
