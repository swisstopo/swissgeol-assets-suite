import { Reflector } from '@nestjs/core';

import { Class } from 'type-fest';
import { Policy } from '@/core/policy';

export const UsePolicy = Reflector.createDecorator<Class<Policy<unknown>>>();
