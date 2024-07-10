import { Reflector } from '@nestjs/core';

import { Policy } from '@shared/policies/base/policy';
import { Class } from 'type-fest';

export const UsePolicy = Reflector.createDecorator<Class<Policy<unknown>>>();
