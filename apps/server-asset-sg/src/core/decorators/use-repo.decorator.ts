import { Reflector } from '@nestjs/core';

import { Class } from 'type-fest';
import { ReadRepo } from '@/core/repo';

export const UseRepo = Reflector.createDecorator<Class<ReadRepo<unknown, unknown>>>();
